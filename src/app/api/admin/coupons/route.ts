import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { requireOperator, AuthError } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export async function GET() {
  try {
    await requireOperator();
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }
  if (!db) return NextResponse.json({ ok: true, coupons: [] });
  const coupons = await db
    .select()
    .from(schema.coupons)
    .orderBy(desc(schema.coupons.createdAt));
  return NextResponse.json({ ok: true, coupons });
}

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
  const code =
    typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const grantCoins = typeof body.grantCoins === "number" ? body.grantCoins : 0;

  if (!code || grantCoins <= 0) {
    return NextResponse.json(
      { ok: false, error: "INVALID_FIELDS" },
      { status: 400 }
    );
  }

  const inserted = await db
    .insert(schema.coupons)
    .values({
      code,
      grantCoins,
      toolSlugRestriction: body.toolSlugRestriction ?? null,
      redemptionCap: body.redemptionCap ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      notes: body.notes ?? null,
    })
    .returning();

  return NextResponse.json({ ok: true, coupon: inserted[0] });
}
