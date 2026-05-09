import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireOperator, AuthError } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { listNativeTools } from "@/lib/tools/registry";
import { brand } from "@/lib/brand.config";

/**
 * Idempotent seed for v1: creates UNIT 014 if missing, then publishes the
 * native tools to slot positions A1, A2.
 *
 * Hit POST /api/admin/seed once after first deploy. Re-running is safe.
 */
export async function POST() {
  try {
    await requireOperator();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ ok: false, error: e.code }, { status: 401 });
    }
    throw e;
  }

  if (!db) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_NOT_CONFIGURED" },
      { status: 500 }
    );
  }

  // 1. Ensure UNIT 014 exists
  const existing = await db
    .select()
    .from(schema.machines)
    .where(eq(schema.machines.unitNumber, brand.unitNumber))
    .limit(1);

  let machineId: string;
  if (existing[0]) {
    machineId = existing[0].id;
  } else {
    const inserted = await db
      .insert(schema.machines)
      .values({
        unitNumber: brand.unitNumber,
        displayName: `${brand.name} · ${brand.unitNumber}`,
        online: true,
      })
      .returning();
    machineId = inserted[0].id;
  }

  // 2. Publish native tools at slot positions
  const slotAssignments: Record<string, { slot: string; featured: boolean }> = {
    "editorial-rewriter": { slot: "A1", featured: false },
    "url-bullets": { slot: "A2", featured: true },
  };

  const native = listNativeTools();
  const results: Array<{ slug: string; status: string }> = [];

  for (const tool of native) {
    const assignment = slotAssignments[tool.slug];
    if (!assignment) continue;

    const existingTool = await db
      .select()
      .from(schema.tools)
      .where(eq(schema.tools.slug, tool.slug))
      .limit(1);

    if (existingTool[0]) {
      results.push({ slug: tool.slug, status: "exists" });
      continue;
    }

    const pricing = tool.pricing.kind === "flat" ? tool.pricing.coins : 0;

    await db.insert(schema.tools).values({
      machineId,
      slotCode: assignment.slot,
      slug: tool.slug,
      shape: tool.shape,
      packaging: tool.packaging,
      priceCoins: pricing,
      name: tool.persona.name,
      glyph: tool.persona.glyph,
      bio: tool.persona.bio,
      accentColor: tool.persona.accentColor ?? null,
      voiceProfile: tool.persona.voiceProfile ?? null,
      creatorCredit: tool.persona.creatorCredit,
      published: true,
      featured: assignment.featured,
    });
    results.push({ slug: tool.slug, status: "created" });
  }

  return NextResponse.json({ ok: true, machineId, results });
}
