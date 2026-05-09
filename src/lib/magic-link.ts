// VEND/AI — Magic-link issuance + delivery
//
// Flow:
//   1. User enters email at /auth/sign-in
//   2. We generate a random token, hash it, store hash in va_magic_link_tokens
//   3. Email the user a link with the raw token: /auth/callback?token=xxx
//   4. Click → token hash matched → user created if new → session set → redirect
//
// Resend is used for delivery in prod. In dev (no RESEND_API_KEY), the link
// is logged to the server console with prefix [AUTH-DEV-LINK] so you can copy
// it into your browser.

import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";

const TOKEN_TTL_MINUTES = 15;

export interface IssueResult {
  ok: true;
  devLink?: string; // populated in dev mode
}

export interface IssueError {
  ok: false;
  error: string;
}

export async function issueMagicLink(
  email: string
): Promise<IssueResult | IssueError> {
  if (!db) {
    return { ok: false, error: "DATABASE_NOT_CONFIGURED" };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    return { ok: false, error: "INVALID_EMAIL" };
  }

  // Generate raw token (32 bytes, hex)
  const rawToken = generateToken();
  const tokenHash = await hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await db.insert(schema.magicLinkTokens).values({
    email: cleanEmail,
    tokenHash,
    expiresAt,
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const link = `${siteUrl}/auth/callback?token=${rawToken}`;

  // Dev fallback: console-log the link
  if (!process.env.RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.log(
      `\n[AUTH-DEV-LINK] Magic link for ${cleanEmail}:\n  ${link}\n  (expires in ${TOKEN_TTL_MINUTES} minutes)\n`
    );
    return { ok: true, devLink: link };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM || "noreply@vendai.com";

  try {
    await resend.emails.send({
      from,
      to: cleanEmail,
      subject: "Your VEND/AI sign-in link",
      html: signInEmail(link),
      text: `Click to sign in to VEND/AI:\n\n${link}\n\nLink expires in ${TOKEN_TTL_MINUTES} minutes.`,
    });
    return { ok: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[AUTH] Failed to send magic link:", err);
    return { ok: false, error: "EMAIL_SEND_FAILED" };
  }
}

export interface ConsumeResult {
  ok: true;
  email: string;
}

export interface ConsumeError {
  ok: false;
  error: "INVALID_TOKEN" | "EXPIRED" | "ALREADY_USED";
}

export async function consumeMagicLink(
  rawToken: string
): Promise<ConsumeResult | ConsumeError> {
  if (!db) {
    return { ok: false, error: "INVALID_TOKEN" };
  }

  const tokenHash = await hashToken(rawToken);

  const rows = await db
    .select()
    .from(schema.magicLinkTokens)
    .where(eq(schema.magicLinkTokens.tokenHash, tokenHash))
    .limit(1);

  const row = rows[0];
  if (!row) return { ok: false, error: "INVALID_TOKEN" };
  if (row.consumedAt) return { ok: false, error: "ALREADY_USED" };
  if (row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "EXPIRED" };
  }

  await db
    .update(schema.magicLinkTokens)
    .set({ consumedAt: new Date() })
    .where(eq(schema.magicLinkTokens.id, row.id));

  return { ok: true, email: row.email };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashToken(rawToken: string): Promise<string> {
  const data = new TextEncoder().encode(rawToken);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(buf);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function signInEmail(link: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="font-family: 'Inter', system-ui, sans-serif; background: #faf8f3; color: #1a1a1a; padding: 48px 24px; max-width: 560px; margin: 0 auto;">
    <div style="border: 1.5px solid #1a1a1a; padding: 32px;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #6e6e6e; margin-bottom: 16px;">VEND/AI &middot; Sign-in</div>
      <h1 style="font-size: 32px; font-weight: 300; letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 24px;">
        Click to enter the arcade.
      </h1>
      <p style="font-size: 15px; line-height: 1.55; color: #3a3a3a; margin: 0 0 32px;">
        This link signs you in to your VEND/AI wallet. It expires in ${TOKEN_TTL_MINUTES} minutes and works once.
      </p>
      <a href="${link}" style="display: inline-block; padding: 14px 28px; background: #1a1a1a; color: #faf8f3; text-decoration: none; font-family: 'JetBrains Mono', monospace; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase;">
        Sign in &rarr;
      </a>
      <p style="font-size: 12px; color: #6e6e6e; margin: 32px 0 0; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.15); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em;">
        Didn't ask for this? Ignore this email.
      </p>
    </div>
  </body>
</html>`;
}
