// VEND/AI — API key issuance + validation
//
// API keys auth external integrations: MCP server, future webhook callers,
// future automation. Format: `va_live_<hex>` (32 bytes random hex). The raw
// key is shown to the operator EXACTLY ONCE on creation; only the hash is
// stored in `va_api_keys`.

import { eq } from "drizzle-orm";
import { db, schema } from "./db";

const KEY_PREFIX = "va_live_";

export interface IssueResult {
  ok: true;
  /** The raw key. Show to operator ONCE; not retrievable afterward. */
  rawKey: string;
  /** First 12 chars (`va_live_xxxx`) for display in the admin list. */
  preview: string;
  id: string;
}

export interface VerifyResult {
  userId: string;
  email: string;
  keyId: string;
  label: string;
}

export class ApiKeyError extends Error {
  constructor(
    public readonly code:
      | "DB_NOT_CONFIGURED"
      | "INVALID_LABEL"
      | "INVALID_KEY"
      | "REVOKED",
    message: string
  ) {
    super(message);
    this.name = "ApiKeyError";
  }
}

/**
 * Issue a new API key for a user. Returns the raw key (only chance to see it)
 * + the hash that's stored. Operator is the typical user who issues a key
 * for themselves to wire up an MCP client.
 */
export async function issueApiKey(
  userId: string,
  label: string
): Promise<IssueResult> {
  if (!db) throw new ApiKeyError("DB_NOT_CONFIGURED", "Database not configured");
  const trimmed = label.trim();
  if (!trimmed) throw new ApiKeyError("INVALID_LABEL", "Label required");

  const rawKey = KEY_PREFIX + generateHex(32);
  const keyHash = await hash(rawKey);
  const preview = rawKey.slice(0, 12); // `va_live_xxxx`

  const inserted = await db
    .insert(schema.apiKeys)
    .values({
      label: trimmed,
      keyHash,
      keyPreview: preview,
      createdByUserId: userId,
    })
    .returning();

  return { ok: true, rawKey, preview, id: inserted[0].id };
}

/**
 * Verify a raw key. Looks up the hash and returns the owning user. Updates
 * `last_used_at` on success.
 */
export async function verifyApiKey(rawKey: string): Promise<VerifyResult | null> {
  if (!db) return null;
  if (typeof rawKey !== "string" || !rawKey.startsWith(KEY_PREFIX)) {
    return null;
  }

  const keyHash = await hash(rawKey);

  const rows = await db
    .select({
      key: schema.apiKeys,
      user: schema.users,
    })
    .from(schema.apiKeys)
    .leftJoin(schema.users, eq(schema.apiKeys.createdByUserId, schema.users.id))
    .where(eq(schema.apiKeys.keyHash, keyHash))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.key.revokedAt) return null;
  if (!row.user) return null;

  // Best-effort touch — don't block the auth path if it fails
  db.update(schema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.apiKeys.id, row.key.id))
    .catch(() => {});

  return {
    userId: row.user.id,
    email: row.user.email,
    keyId: row.key.id,
    label: row.key.label,
  };
}

export async function revokeApiKey(id: string): Promise<void> {
  if (!db) throw new ApiKeyError("DB_NOT_CONFIGURED", "Database not configured");
  await db
    .update(schema.apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(schema.apiKeys.id, id));
}

// ── helpers ──────────────────────────────────────────────────────────────

function generateHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hash(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(buf);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
