// VEND/AI — Wallet & coin ledger
//
// Operations: reserve · settle · refund · grant · packPurchase · getBalance
//
// Pattern: every coin-affecting action creates a transaction row. Pulls go
// pending → settled (or refunded). Grants and pack purchases are immediately
// settled. The wallet's balance is derived from the sum of settled tx but
// also denormalized on `va_wallets.balance_coins` for fast reads.

import { eq, sql } from "drizzle-orm";
import { db, schema } from "./db";

export class WalletError extends Error {
  constructor(
    public readonly code:
      | "WALLET_NOT_FOUND"
      | "INSUFFICIENT_COINS"
      | "RESERVATION_NOT_FOUND"
      | "RESERVATION_NOT_PENDING"
      | "DB_NOT_CONFIGURED",
    message: string
  ) {
    super(message);
    this.name = "WalletError";
  }
}

export async function getOrCreateWallet(userId: string) {
  if (!db) throw new WalletError("DB_NOT_CONFIGURED", "Database not configured");

  const existing = await db
    .select()
    .from(schema.wallets)
    .where(eq(schema.wallets.userId, userId))
    .limit(1);

  if (existing[0]) return existing[0];

  const inserted = await db
    .insert(schema.wallets)
    .values({ userId, balanceCoins: 0 })
    .returning();

  return inserted[0];
}

export async function getBalance(userId: string): Promise<number> {
  const wallet = await getOrCreateWallet(userId);
  return wallet.balanceCoins;
}

export interface Reservation {
  id: string;
  walletId: string;
  coins: number;
  toolSlug: string;
}

export async function reserve(
  userId: string,
  coins: number,
  toolSlug: string
): Promise<Reservation> {
  if (!db) throw new WalletError("DB_NOT_CONFIGURED", "Database not configured");

  if (coins <= 0) {
    throw new WalletError("INSUFFICIENT_COINS", "Reservation must be positive");
  }

  const wallet = await getOrCreateWallet(userId);

  if (wallet.balanceCoins < coins) {
    throw new WalletError("INSUFFICIENT_COINS", "Wallet balance below pull cost");
  }

  // Deduct atomically: only succeeds if balance still >= coins.
  const updated = await db
    .update(schema.wallets)
    .set({
      balanceCoins: sql`${schema.wallets.balanceCoins} - ${coins}`,
      updatedAt: new Date(),
    })
    .where(
      sql`${schema.wallets.id} = ${wallet.id} AND ${schema.wallets.balanceCoins} >= ${coins}`
    )
    .returning();

  if (!updated[0]) {
    throw new WalletError("INSUFFICIENT_COINS", "Concurrent deduction; retry");
  }

  const tx = await db
    .insert(schema.transactions)
    .values({
      walletId: wallet.id,
      kind: "pull",
      coins: -coins,
      status: "pending",
      toolSlug,
    })
    .returning();

  return {
    id: tx[0].id,
    walletId: wallet.id,
    coins,
    toolSlug,
  };
}

export async function settle(reservationId: string): Promise<void> {
  if (!db) throw new WalletError("DB_NOT_CONFIGURED", "Database not configured");

  const updated = await db
    .update(schema.transactions)
    .set({ status: "settled" })
    .where(
      sql`${schema.transactions.id} = ${reservationId} AND ${schema.transactions.status} = 'pending'`
    )
    .returning();

  if (!updated[0]) {
    throw new WalletError(
      "RESERVATION_NOT_PENDING",
      "Reservation not pending; cannot settle"
    );
  }
}

export async function refund(reservationId: string): Promise<void> {
  if (!db) throw new WalletError("DB_NOT_CONFIGURED", "Database not configured");

  // Mark reservation refunded + restore balance
  const tx = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.id, reservationId))
    .limit(1);

  const reservation = tx[0];
  if (!reservation) {
    throw new WalletError("RESERVATION_NOT_FOUND", "Reservation not found");
  }
  if (reservation.status !== "pending") {
    // Idempotent: already settled or refunded — no-op
    return;
  }

  const coinsToRestore = Math.abs(reservation.coins);

  await db.transaction(async (tx) => {
    await tx
      .update(schema.transactions)
      .set({ status: "refunded" })
      .where(eq(schema.transactions.id, reservationId));

    await tx
      .update(schema.wallets)
      .set({
        balanceCoins: sql`${schema.wallets.balanceCoins} + ${coinsToRestore}`,
        updatedAt: new Date(),
      })
      .where(eq(schema.wallets.id, reservation.walletId));
  });
}

export async function grant(
  userId: string,
  coins: number,
  reason: string
): Promise<void> {
  if (!db) throw new WalletError("DB_NOT_CONFIGURED", "Database not configured");

  if (coins <= 0) return;

  const wallet = await getOrCreateWallet(userId);

  await db.transaction(async (tx) => {
    await tx
      .update(schema.wallets)
      .set({
        balanceCoins: sql`${schema.wallets.balanceCoins} + ${coins}`,
        updatedAt: new Date(),
      })
      .where(eq(schema.wallets.id, wallet.id));

    await tx.insert(schema.transactions).values({
      walletId: wallet.id,
      kind: "grant",
      coins,
      status: "settled",
      metadata: { reason },
    });
  });
}

/**
 * One-time welcome grant. Idempotent: checks if any 'grant' tx exists
 * for this wallet with metadata.reason='welcome'.
 */
export async function grantWelcomeIfNew(userId: string): Promise<void> {
  if (!db) return;

  const wallet = await getOrCreateWallet(userId);
  const prior = await db
    .select()
    .from(schema.transactions)
    .where(
      sql`${schema.transactions.walletId} = ${wallet.id} AND ${schema.transactions.kind} = 'grant' AND ${schema.transactions.metadata}->>'reason' = 'welcome'`
    )
    .limit(1);

  if (prior[0]) return; // already granted

  await grant(userId, 10, "welcome");
}
