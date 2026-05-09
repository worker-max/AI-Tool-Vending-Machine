import { NextResponse } from "next/server";
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
  if (!db) return NextResponse.json({ ok: true, submissions: [] });
  const submissions = await db
    .select()
    .from(schema.toolSubmissions)
    .orderBy(desc(schema.toolSubmissions.createdAt));
  return NextResponse.json({ ok: true, submissions });
}
