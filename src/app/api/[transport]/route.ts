// VEND/AI — MCP server route
//
// Single Next.js route that handles both `/api/mcp` (streamable HTTP) and
// `/api/sse` (server-sent events) per the mcp-handler convention. Every
// request is authenticated by API key (Bearer token). Tool calls route
// through the same dispatcher the arcade uses.
//
// Client setup (Claude Desktop / Claude.ai / Cursor):
//   Streamable HTTP:  https://<your-vendai-host>/api/mcp
//   Bearer token:     va_live_xxxxxxxx... (issue at /control/api-keys)

import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { verifyApiKey } from "@/lib/api-keys";
import { registerVendaiTools } from "@/lib/mcp/server";

const handler = createMcpHandler(
  (server) => {
    // Tool handlers read auth from `extra.authInfo` at call time; the
    // verifier below populates it from the API key.
    registerVendaiTools(server);
  },
  {},
  {
    basePath: "/api",
    verboseLogs: process.env.NODE_ENV !== "production",
  }
);

/**
 * Verify the Bearer token (API key). Returns AuthInfo if valid; undefined
 * otherwise (which makes withMcpAuth respond 401).
 */
async function verifyToken(
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;

  const result = await verifyApiKey(bearerToken);
  if (!result) return undefined;

  return {
    token: bearerToken,
    scopes: ["tools:call"],
    clientId: result.userId,
    extra: {
      userId: result.userId,
      email: result.email,
      keyId: result.keyId,
      label: result.label,
    },
  };
}

const authedHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  requiredScopes: ["tools:call"],
});

export { authedHandler as GET, authedHandler as POST, authedHandler as DELETE };
