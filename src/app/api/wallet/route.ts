import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getOrCreateWallet } from "@/lib/wallet";
import { db, schema } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "NOT_AUTHENTICATED" },
      { status: 401 }
    );
  }

  const wallet = await getOrCreateWallet(session.userId);

  if (!db) {
    return NextResponse.json({
      ok: true,
      balanceCoins: wallet.balanceCoins,
      transactions: [],
    });
  }

  const transactions = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.walletId, wallet.id))
    .orderBy(desc(schema.transactions.createdAt))
    .limit(50);

  return NextResponse.json({
    ok: true,
    balanceCoins: wallet.balanceCoins,
    transactions,
  });
}
