// VEND/AI — Coupon redemption
//
// Codes grant N coins. Optionally restricted to a tool slug or a redemption cap.
// Each user can redeem a given coupon at most once.

import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { grant } from "./wallet";

export type RedemptionResult =
  | { ok: true; grantedCoins: number; restriction: string | null }
  | {
      ok: false;
      error:
        | "NOT_FOUND"
        | "INACTIVE"
        | "EXPIRED"
        | "CAP_REACHED"
        | "ALREADY_REDEEMED"
        | "DB_NOT_CONFIGURED";
    };

export async function redeemCoupon(
  userId: string,
  code: string
): Promise<RedemptionResult> {
  if (!db) return { ok: false, error: "DB_NOT_CONFIGURED" };

  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return { ok: false, error: "NOT_FOUND" };

  const rows = await db
    .select()
    .from(schema.coupons)
    .where(eq(schema.coupons.code, cleanCode))
    .limit(1);

  const coupon = rows[0];
  if (!coupon) return { ok: false, error: "NOT_FOUND" };
  if (!coupon.active) return { ok: false, error: "INACTIVE" };

  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "EXPIRED" };
  }
  if (
    coupon.redemptionCap !== null &&
    coupon.redemptionCount >= coupon.redemptionCap
  ) {
    return { ok: false, error: "CAP_REACHED" };
  }

  // Has this user already redeemed this coupon?
  const prior = await db
    .select()
    .from(schema.couponRedemptions)
    .where(
      and(
        eq(schema.couponRedemptions.couponId, coupon.id),
        eq(schema.couponRedemptions.userId, userId)
      )
    )
    .limit(1);

  if (prior[0]) return { ok: false, error: "ALREADY_REDEEMED" };

  // Atomically increment redemption count + insert redemption row + grant coins
  await db.transaction(async (tx) => {
    await tx
      .update(schema.coupons)
      .set({
        redemptionCount: sql`${schema.coupons.redemptionCount} + 1`,
      })
      .where(eq(schema.coupons.id, coupon.id));

    await tx.insert(schema.couponRedemptions).values({
      couponId: coupon.id,
      userId,
    });
  });

  await grant(userId, coupon.grantCoins, `coupon:${cleanCode}`);

  return {
    ok: true,
    grantedCoins: coupon.grantCoins,
    restriction: coupon.toolSlugRestriction,
  };
}
