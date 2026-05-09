import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { requireOperator, AuthError } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { issueApiKey } from "@/lib/api-keys";

export async function GET() {
  try {
    await requireOperator();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ ok: false, error: e.code }, { status: 401 });
    }
    throw e;
  }
  if (!db) return NextResponse.json({ ok: true, keys: [] });

  const keys = await db
    .select()
    .from(schema.apiKeys)
    .orderBy(desc(schema.apiKeys.createdAt));

  return NextResponse.json({ ok: true, keys });
}

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireOperator();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ ok: false, error: e.code }, { status: 401 });
    }
    throw e;
  }

  const body = await request.json().catch(() => ({}));
  const label = typeof body?.label === "string" ? body.label : "";
  if (!label.trim()) {
    return NextResponse.json(
      { ok: false, error: "LABEL_REQUIRED" },
      { status: 400 }
    );
  }

  const result = await issueApiKey(session.userId, label);
  return NextResponse.json(result);
}
