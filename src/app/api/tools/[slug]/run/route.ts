import { NextRequest, NextResponse } from "next/server";
import { dispatch } from "@/lib/tools/dispatcher";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "NOT_AUTHENTICATED", message: "Sign in required" },
      { status: 401 }
    );
  }

  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const input = body?.input ?? body;

  const result = await dispatch(slug, input, {
    userId: session.userId,
    email: session.email,
  });

  const status = result.ok
    ? 200
    : result.error === "NOT_AUTHENTICATED"
    ? 401
    : result.error === "TOOL_NOT_FOUND" || result.error === "TOOL_NOT_PUBLISHED"
    ? 404
    : result.error === "INVALID_INPUT"
    ? 400
    : result.error === "INSUFFICIENT_COINS"
    ? 402
    : 500;

  return NextResponse.json(result, { status });
}
