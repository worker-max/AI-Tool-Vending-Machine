import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireOperator, AuthError } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { grant } from "@/lib/wallet";

/**
 * Operator-only "grant coins to a user" — used in v1 because Stripe pack
 * purchases aren't wired yet. Operator finds a user by email, types a coin
 * amount + reason, this route credits the wallet.
 */
export async function POST(request: NextRequest) {
  try {
    await requireOperator();
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }
  if (!db)
    return NextResponse.json(
      { ok: false, error: "DATABASE_NOT_CONFIGURED" },
      { status: 500 }
    );

  const body = await request.json().catch(() => ({}));
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const coins = typeof body.coins === "number" ? body.coins : 0;
  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : "operator_grant";

  if (!email || coins <= 0) {
    return NextResponse.json(
      { ok: false, error: "INVALID_FIELDS" },
      { status: 400 }
    );
  }

  // Find the user
  const userRows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!userRows[0]) {
    return NextResponse.json(
      { ok: false, error: "USER_NOT_FOUND" },
      { status: 404 }
    );
  }

  await grant(userRows[0].id, coins, reason);

  return NextResponse.json({ ok: true });
}
