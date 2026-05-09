import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { consumeMagicLink } from "@/lib/magic-link";
import { createSession } from "@/lib/auth";
import { grantWelcomeIfNew } from "@/lib/wallet";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const redirect = request.nextUrl.searchParams.get("redirect") || "/arcade";

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=missing_token", request.url)
    );
  }

  const result = await consumeMagicLink(token);
  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${result.error.toLowerCase()}`, request.url)
    );
  }

  if (!db) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=database_not_configured", request.url)
    );
  }

  const email = result.email;
  const operatorEmail = (process.env.OPERATOR_EMAIL || "")
    .trim()
    .toLowerCase();
  const role = email === operatorEmail ? "operator" : "user";

  // Find or create user
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  let user;
  if (existing[0]) {
    user = existing[0];
    // Update lastSignInAt + promote role if env-elected operator
    const updates: Partial<typeof schema.users.$inferInsert> = {
      lastSignInAt: new Date(),
    };
    if (role === "operator" && user.role !== "operator") {
      updates.role = "operator";
    }
    await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, user.id));
  } else {
    const inserted = await db
      .insert(schema.users)
      .values({
        email,
        role,
        lastSignInAt: new Date(),
      })
      .returning();
    user = inserted[0];
  }

  // Welcome grant (idempotent)
  await grantWelcomeIfNew(user.id);

  // Set session
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: role === "operator" || user.role === "operator" ? "operator" : "user",
  });

  return NextResponse.redirect(new URL(redirect, request.url));
}
