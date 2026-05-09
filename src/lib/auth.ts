// VEND/AI — Auth (JWT cookie + magic-link via Resend)
//
// Pattern: signed JWT in HTTP-only cookie. Magic link is a one-time token
// emailed to the user; clicking it sets the session cookie.
//
// Falls back to dev secret if JWT_SECRET unset (insecure — set in prod).

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "va_session";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    "dev-jwt-secret-change-in-production-CHANGE-ME-CHANGE-ME"
);

export interface Session {
  userId: string;
  email: string;
  name: string | null;
  role: "user" | "operator";
}

export async function createSession(session: Session): Promise<string> {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return token;
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: payload.name === null || payload.name === undefined ? null : String(payload.name),
      role: payload.role === "operator" ? "operator" : "user",
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("UNAUTHENTICATED", "Sign in required");
  }
  return session;
}

export async function requireOperator(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "operator") {
    throw new AuthError("FORBIDDEN", "Operator access required");
  }
  return session;
}

export class AuthError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}
