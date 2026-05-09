import { NextResponse } from "next/server";
import { requireOperator, AuthError } from "@/lib/auth";
import { revokeApiKey } from "@/lib/api-keys";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOperator();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ ok: false, error: e.code }, { status: 401 });
    }
    throw e;
  }
  const { id } = await params;
  await revokeApiKey(id);
  return NextResponse.json({ ok: true });
}
