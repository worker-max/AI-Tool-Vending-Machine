import { NextRequest, NextResponse } from "next/server";
import { redeemCoupon } from "@/lib/coupons";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "NOT_AUTHENTICATED" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body?.code === "string" ? body.code : "";

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "CODE_REQUIRED" },
      { status: 400 }
    );
  }

  const result = await redeemCoupon(session.userId, code);

  if (!result.ok) {
    const status =
      result.error === "NOT_FOUND" || result.error === "INACTIVE"
        ? 404
        : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
