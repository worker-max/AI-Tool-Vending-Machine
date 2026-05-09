// VEND/AI — MCP server builder
//
// Exposes every published native tool as an MCP tool, prefixed `vendai_`.
// The MCP handler routes calls through the same dispatcher that powers the
// arcade — so every pull (web or MCP) bills the wallet, auto-refunds on
// failure, increments pull counts. One registry, two surfaces.
//
// Auth comes from the per-request `extra.authInfo` populated by the
// withMcpAuth wrapper at the route level. The verifier stashes
// `{ userId, email }` in `authInfo.extra`; we read it at call time.

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodRawShape } from "zod";
import { z } from "zod";
import { listNativeTools } from "../tools/registry";
import { dispatch } from "../tools/dispatcher";

/**
 * Register every native tool on the McpServer. Each MCP tool name is
 * `vendai_<slug>` (slug uses underscores).
 */
export function registerVendaiTools(server: McpServer) {
  for (const tool of listNativeTools()) {
    const mcpName = `vendai_${tool.slug.replace(/-/g, "_")}`;

    server.registerTool(
      mcpName,
      {
        title: tool.persona.name,
        description: buildDescription(tool),
        inputSchema: zodObjectShape(tool.inputSchema),
        outputSchema: zodObjectShape(tool.outputSchema),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: tool.slug === "url-bullets",
        },
      },
      async (
        input: Record<string, unknown>,
        extra: { authInfo?: { extra?: Record<string, unknown> } }
      ) => {
        const authInfo = extra?.authInfo;
        const userId = authInfo?.extra?.userId;
        const email = authInfo?.extra?.email;

        if (typeof userId !== "string" || typeof email !== "string") {
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: "NOT_AUTHENTICATED: missing userId in auth context",
              },
            ],
          };
        }

        const result = await dispatch(tool.slug, input, { userId, email });

        if (!result.ok) {
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: `${result.error}: ${result.message}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: formatOutput(tool.slug, result.output),
            },
          ],
          structuredContent: result.output as Record<string, unknown>,
        };
      }
    );
  }
}

function buildDescription(
  tool: ReturnType<typeof listNativeTools>[number]
): string {
  const coins = tool.pricing.kind === "flat" ? tool.pricing.coins : 0;
  const usd = (coins / 100).toFixed(2);
  return `${tool.persona.bio}\n\nCost: ${coins} coins ($${usd}) per call. Failed calls auto-refund. VIP grants override the wallet bill.`;
}

function formatOutput(_slug: string, output: unknown): string {
  if (output && typeof output === "object" && "rewritten" in output) {
    return String((output as { rewritten: string }).rewritten);
  }
  if (
    output &&
    typeof output === "object" &&
    "bullets" in output &&
    Array.isArray((output as { bullets: unknown[] }).bullets)
  ) {
    const o = output as { bullets: string[]; source_title?: string };
    const header = o.source_title ? `${o.source_title}\n\n` : "";
    return (
      header +
      o.bullets
        .map((b, i) => `${(i + 1).toString().padStart(2, "0")}. ${b}`)
        .join("\n")
    );
  }
  return JSON.stringify(output, null, 2);
}

// Extract the Zod raw shape (for SDK 1.26 — registerTool wants `{ field: ZodType }`,
// not the wrapping z.object). Our schemas are all built with z.object so this
// is safe; if a tool used a non-object root schema we'd return an empty shape.
function zodObjectShape(schema: z.ZodTypeAny): ZodRawShape {
  if (schema instanceof z.ZodObject) {
    return schema.shape as ZodRawShape;
  }
  return {} as ZodRawShape;
}
