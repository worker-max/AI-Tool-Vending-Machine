import { NextRequest, NextResponse } from "next/server";
import { issueMagicLink } from "@/lib/magic-link";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email : "";

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "EMAIL_REQUIRED" },
      { status: 400 }
    );
  }

  const result = await issueMagicLink(email);

  if (!result.ok) {
    const status = result.error === "INVALID_EMAIL" ? 400 : 500;
    return NextResponse.json(result, { status });
  }

  // In dev mode (no Resend), include the link so the user can click through
  // without copying from server console.
  return NextResponse.json(result);
}
