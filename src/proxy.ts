// VEND/AI — Edge proxy (Next 16 — was `middleware` in Next 15 and earlier)
//
// Two responsibilities:
//   1. Hostname split — `control.<domain>` rewrites to `/control/*` admin routes.
//      In dev this is `control.localhost:3000`. In prod it's `control.vendai.com`.
//   2. Auth gating — protected routes redirect to /auth/sign-in if no session.
//
// Public-by-default. Specific paths require auth (wallet, tool runs, admin).

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "va_session";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    "dev-jwt-secret-change-in-production-CHANGE-ME-CHANGE-ME"
);

const ADMIN_HOST_PROD = "control.vendai.com";
const ADMIN_HOST_DEV = "control.localhost:3000";

interface SessionPayload {
  userId: string;
  email: string;
  role: "user" | "operator";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // ── Hostname split: rewrite control.<domain> → /control/* ────────────
  const isAdminHost =
    host === ADMIN_HOST_PROD || host === ADMIN_HOST_DEV;

  if (isAdminHost && !pathname.startsWith("/control")) {
    const url = request.nextUrl.clone();
    url.pathname = `/control${pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Auth gating ──────────────────────────────────────────────────────
  const session = await readSession(request);

  // Admin routes (under /control) require operator
  const isAdminPath = pathname.startsWith("/control") || isAdminHost;
  if (isAdminPath) {
    // Allow login + auth callback unauthenticated
    if (
      pathname.startsWith("/control/auth") ||
      pathname.startsWith("/auth/sign-in") ||
      pathname.startsWith("/auth/callback") ||
      pathname.startsWith("/api/auth")
    ) {
      return NextResponse.next();
    }
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== "operator") {
      // Authenticated but not operator — bounce to public arcade
      const url = request.nextUrl.clone();
      url.pathname = "/arcade";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // User-area routes that require any authenticated session
  const userOnlyPaths = ["/wallet", "/coupons", "/account"];
  if (userOnlyPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

async function readSession(
  request: NextRequest
): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      role: payload.role === "operator" ? "operator" : "user",
    };
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    // Run on everything except Next internals + static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
