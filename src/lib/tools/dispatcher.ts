// VEND/AI — Tool dispatcher
//
// One entry point for "run a tool":
//   1. Load tool from DB (resolves machine, slug, status)
//   2. Validate input against the tool's Zod schema
//   3. Try to bill the pull as a VIP charge first
//   4. Otherwise reserve coins from the wallet
//   5. Route to the right adapter by packaging
//   6. Validate output, then settle (or refund on failure)

import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import * as wallet from "../wallet";
import { tryVipBill } from "../vip";
import type { ToolDefinition, DispatchResult, ToolContext } from "./contract";
import { getNativeTool } from "./registry";
import { runNative } from "./adapters/native";
import { runHttp } from "./adapters/http";
import { runSandbox } from "./adapters/sandbox";

export async function dispatch(
  slug: string,
  rawInput: unknown,
  user: { userId: string; email: string }
): Promise<DispatchResult> {
  if (!db) {
    return { ok: false, error: "ADAPTER_NOT_AVAILABLE", message: "Database not configured" };
  }

  // Load DB record (canonical state — published flag, current price, etc.)
  const rows = await db
    .select()
    .from(schema.tools)
    .where(eq(schema.tools.slug, slug))
    .limit(1);

  const dbTool = rows[0];
  if (!dbTool) {
    return { ok: false, error: "TOOL_NOT_FOUND", message: "Tool not found" };
  }
  if (!dbTool.published) {
    return { ok: false, error: "TOOL_NOT_PUBLISHED", message: "Tool not yet published" };
  }

  // Resolve definition (native = code, http/sandbox = DB-driven)
  const definition = resolveDefinition(dbTool);
  if (!definition) {
    return {
      ok: false,
      error: "ADAPTER_NOT_AVAILABLE",
      message: `No adapter available for packaging '${dbTool.packaging}'`,
    };
  }

  // Validate input
  const parsed = definition.inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "INVALID_INPUT",
      message: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const priceCoins = dbTool.priceCoins;

  // Try VIP billing first
  let usedVip = false;
  let reservation: wallet.Reservation | null = null;

  try {
    usedVip = await tryVipBill(user.userId, priceCoins, slug);
    if (!usedVip) {
      reservation = await wallet.reserve(user.userId, priceCoins, slug);
    }
  } catch (err) {
    if (err instanceof wallet.WalletError && err.code === "INSUFFICIENT_COINS") {
      return {
        ok: false,
        error: "INSUFFICIENT_COINS",
        message: "Wallet balance below pull cost",
      };
    }
    throw err;
  }

  // Build context
  const ctx: ToolContext = {
    userId: user.userId,
    walletId: reservation?.walletId ?? "",
    log: (msg, ...rest) => {
      // eslint-disable-next-line no-console
      console.log(`[tool:${slug}] ${msg}`, ...rest);
    },
  };

  // Adapter dispatch
  try {
    let output: unknown;
    switch (definition.packaging) {
      case "native":
        output = await runNative(definition, parsed.data, ctx);
        break;
      case "http":
        output = await runHttp(definition, parsed.data, ctx);
        break;
      case "sandbox":
        output = await runSandbox(definition, parsed.data, ctx);
        break;
    }

    // Validate output
    const validated = definition.outputSchema.safeParse(output);
    if (!validated.success) {
      throw new ToolFailure(
        `Tool returned invalid output: ${validated.error.issues
          .map((i) => i.message)
          .join(", ")}`
      );
    }

    // Settle
    if (reservation) await wallet.settle(reservation.id);

    // Increment pull count (best-effort)
    try {
      await db
        .update(schema.tools)
        .set({ pullCount: dbTool.pullCount + 1 })
        .where(eq(schema.tools.id, dbTool.id));
    } catch {
      // Non-fatal — pull succeeded, count is denormalized
    }

    return {
      ok: true,
      output: validated.data,
      coinsCharged: priceCoins,
      vip: usedVip,
    };
  } catch (err) {
    // Auto-refund on failure (idempotent)
    if (reservation) {
      try {
        await wallet.refund(reservation.id);
      } catch {
        // Refund failure is logged but not surfaced
        // eslint-disable-next-line no-console
        console.error(`[tool:${slug}] refund failed`);
      }
    }
    const message = err instanceof Error ? err.message : "Tool failure";
    return { ok: false, error: "TOOL_FAILURE", message };
  }
}

function resolveDefinition(
  dbTool: typeof schema.tools.$inferSelect
): ToolDefinition | null {
  if (dbTool.packaging === "native") {
    return getNativeTool(dbTool.slug);
  }

  // http / sandbox: build a minimal definition from DB record
  // (full schema validation deferred to adapter; v1 only allows native)
  return null;
}

export class ToolFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolFailure";
  }
}
