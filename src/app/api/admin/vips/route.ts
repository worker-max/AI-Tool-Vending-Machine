import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
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
  if (!db) return NextResponse.json({ ok: true, vips: [] });
  const rows = await db
    .select({
      grant: schema.vipGrants,
      user: schema.users,
    })
    .from(schema.vipGrants)
    .leftJoin(schema.users, eq(schema.vipGrants.userId, schema.users.id));
  return NextResponse.json({ ok: true, vips: rows });
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
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const monthlyBudgetCoins =
    typeof body.monthlyBudgetCoins === "number" ? body.monthlyBudgetCoins : 0;

  if (!email || monthlyBudgetCoins <= 0) {
    return NextResponse.json(
      { ok: false, error: "INVALID_FIELDS" },
      { status: 400 }
    );
  }

  // Find or create the user
  const userRows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  let user = userRows[0];
  if (!user) {
    const inserted = await db
      .insert(schema.users)
      .values({ email })
      .returning();
    user = inserted[0];
  }

  const grant = await db
    .insert(schema.vipGrants)
    .values({
      userId: user.id,
      monthlyBudgetCoins,
      notes: body.notes ?? null,
    })
    .onConflictDoUpdate({
      target: schema.vipGrants.userId,
      set: {
        monthlyBudgetCoins,
        active: true,
        notes: body.notes ?? null,
      },
    })
    .returning();

  return NextResponse.json({ ok: true, grant: grant[0], user });
}
