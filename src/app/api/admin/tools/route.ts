import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { requireOperator, AuthError } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export async function GET() {
  try {
    await requireOperator();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ ok: false, error: e.code }, { status: 401 });
    }
    throw e;
  }
  if (!db) return NextResponse.json({ ok: true, tools: [] });
  const tools = await db
    .select()
    .from(schema.tools)
    .orderBy(desc(schema.tools.createdAt));
  return NextResponse.json({ ok: true, tools });
}

export async function POST(request: NextRequest) {
  try {
    await requireOperator();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ ok: false, error: e.code }, { status: 401 });
    }
    throw e;
  }
  if (!db)
    return NextResponse.json(
      { ok: false, error: "DATABASE_NOT_CONFIGURED" },
      { status: 500 }
    );

  const body = await request.json().catch(() => ({}));
  if (
    !body.machineId ||
    !body.slotCode ||
    !body.slug ||
    !body.shape ||
    !body.packaging ||
    typeof body.priceCoins !== "number" ||
    !body.name ||
    !body.glyph ||
    !body.bio ||
    !body.creatorCredit
  ) {
    return NextResponse.json(
      { ok: false, error: "MISSING_FIELDS" },
      { status: 400 }
    );
  }

  const inserted = await db
    .insert(schema.tools)
    .values({
      machineId: body.machineId,
      slotCode: body.slotCode,
      slug: body.slug,
      shape: body.shape,
      packaging: body.packaging,
      priceCoins: body.priceCoins,
      name: body.name,
      glyph: body.glyph,
      bio: body.bio,
      accentColor: body.accentColor ?? null,
      voiceProfile: body.voiceProfile ?? null,
      creatorCredit: body.creatorCredit,
      config: body.config ?? null,
      published: body.published ?? false,
      featured: body.featured ?? false,
    })
    .returning();

  return NextResponse.json({ ok: true, tool: inserted[0] });
}
