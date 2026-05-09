// VEND/AI — VIP grants
//
// A user with an active VIP grant has pulls billed against a monthly budget
// pool instead of their wallet. When the budget is exhausted (or expired),
// pulls fall back to the wallet.

import { eq, sql } from "drizzle-orm";
import { db, schema } from "./db";
import type { VipGrant } from "./db/schema";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export async function getActiveVip(userId: string): Promise<VipGrant | null> {
  if (!db) return null;

  const rows = await db
    .select()
    .from(schema.vipGrants)
    .where(eq(schema.vipGrants.userId, userId))
    .limit(1);

  const grant = rows[0];
  if (!grant || !grant.active) return null;

  // Roll over the month if needed
  if (grant.monthAnchor.getTime() + MONTH_MS < Date.now()) {
    const updated = await db
      .update(schema.vipGrants)
      .set({
        monthAnchor: new Date(),
        monthSpentCoins: 0,
      })
      .where(eq(schema.vipGrants.id, grant.id))
      .returning();
    return updated[0] ?? null;
  }

  return grant;
}

/**
 * Returns true if VIP was used (pull fully covered by VIP budget).
 * Returns false if the user is not a VIP, or budget would be exceeded.
 */
export async function tryVipBill(
  userId: string,
  coins: number,
  toolSlug: string
): Promise<boolean> {
  if (!db) return false;

  const vip = await getActiveVip(userId);
  if (!vip) return false;

  if (vip.monthSpentCoins + coins > vip.monthlyBudgetCoins) {
    return false;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(schema.vipGrants)
      .set({
        monthSpentCoins: sql`${schema.vipGrants.monthSpentCoins} + ${coins}`,
      })
      .where(eq(schema.vipGrants.id, vip.id));

    // Wallet balance unaffected; record the pull as a 'vip_pull' tx (denormalized)
    const wallet = await tx
      .select()
      .from(schema.wallets)
      .where(eq(schema.wallets.userId, userId))
      .limit(1);

    if (wallet[0]) {
      await tx.insert(schema.transactions).values({
        walletId: wallet[0].id,
        kind: "vip_pull",
        coins: 0, // wallet unchanged; VIP budget tracked separately
        status: "settled",
        toolSlug,
        metadata: { vip_grant_id: vip.id, vip_coins_billed: coins },
      });
    }
  });

  return true;
}
