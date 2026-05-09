import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getOrCreateWallet } from "@/lib/wallet";
import { getActiveVip } from "@/lib/vip";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in?redirect=/wallet");

  const wallet = await getOrCreateWallet(session.userId);
  const vip = await getActiveVip(session.userId);

  const transactions = db
    ? await db
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.walletId, wallet.id))
        .orderBy(desc(schema.transactions.createdAt))
        .limit(50)
    : [];

  return (
    <div>
      <div className="label">{session.email} · Wallet</div>
      <h1
        className="display"
        style={{ fontSize: "clamp(36px, 4vw, 56px)", marginTop: 12 }}
      >
        {wallet.balanceCoins} <em>coins.</em>
      </h1>
      <p style={{ marginTop: 12, color: "var(--ink-2)" }}>
        ${(wallet.balanceCoins / 100).toFixed(2)} of arcade credit.
      </p>

      {vip && (
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: "var(--tangerine-wash)",
            borderLeft: "3px solid var(--tangerine)",
          }}
        >
          <div className="label" style={{ color: "var(--tangerine)" }}>
            VIP · Active
          </div>
          <div style={{ marginTop: 8, fontSize: 16 }}>
            Monthly budget:{" "}
            <strong>{vip.monthlyBudgetCoins} coins</strong> · spent this month:{" "}
            <strong>{vip.monthSpentCoins}</strong>
          </div>
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--ink-2)" }}>
            VIP pulls are billed against your budget pool, not your wallet.
            When the pool is empty for the month, pulls fall back to wallet
            balance.
          </p>
        </div>
      )}

      <section style={{ marginTop: 64 }}>
        <div className="label" style={{ marginBottom: 16 }}>
          Pack purchases
        </div>
        <p
          style={{ color: "var(--ink-3)", fontSize: 14, marginBottom: 24 }}
        >
          Stripe pack purchases land in v1.1. For v1, the operator can grant
          coins on request — email <strong>{process.env.OPERATOR_EMAIL || "the operator"}</strong>.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            opacity: 0.5,
          }}
        >
          {[
            { label: "$5 pack", coins: 500, bonus: "" },
            { label: "$20 pack", coins: 2200, bonus: "10% bonus" },
            { label: "$50 pack", coins: 6000, bonus: "20% bonus" },
          ].map((p) => (
            <div
              key={p.label}
              className="card-paper"
              style={{ padding: 20 }}
            >
              <div className="label">{p.label}</div>
              <div
                style={{ marginTop: 8, fontSize: 24, fontWeight: 500 }}
              >
                {p.coins.toLocaleString()} coins
              </div>
              {p.bonus && (
                <div
                  className="mono"
                  style={{ color: "var(--tangerine)", fontSize: 11, marginTop: 4 }}
                >
                  {p.bonus.toUpperCase()}
                </div>
              )}
              <div
                className="mono"
                style={{ marginTop: 12, fontSize: 10, color: "var(--ink-3)" }}
              >
                NOT YET WIRED · v1.1
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 64 }}>
        <div className="label" style={{ marginBottom: 16 }}>
          Recent activity
        </div>
        {transactions.length === 0 ? (
          <p className="mono" style={{ color: "var(--ink-3)", fontSize: 12 }}>
            NO TRANSACTIONS YET · WELCOME GRANT WILL APPEAR ON FIRST SIGN-IN
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--ink)",
                  textAlign: "left",
                }}
              >
                <th className="label" style={{ padding: "8px 0" }}>
                  Date
                </th>
                <th className="label" style={{ padding: "8px 0" }}>
                  Kind
                </th>
                <th className="label" style={{ padding: "8px 0" }}>
                  Tool
                </th>
                <th className="label" style={{ padding: "8px 0" }}>
                  Status
                </th>
                <th
                  className="label"
                  style={{ padding: "8px 0", textAlign: "right" }}
                >
                  Coins
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr
                  key={t.id}
                  style={{ borderBottom: "1px solid var(--hairline)" }}
                >
                  <td
                    className="mono"
                    style={{ padding: "10px 0", fontSize: 11, color: "var(--ink-3)" }}
                  >
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="mono" style={{ padding: "10px 0", fontSize: 11 }}>
                    {t.kind.toUpperCase()}
                  </td>
                  <td style={{ padding: "10px 0", fontSize: 14 }}>
                    {t.toolSlug || "—"}
                  </td>
                  <td className="mono" style={{ padding: "10px 0", fontSize: 11 }}>
                    {t.status.toUpperCase()}
                  </td>
                  <td
                    style={{
                      padding: "10px 0",
                      fontSize: 14,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      color:
                        t.coins > 0
                          ? "var(--success)"
                          : t.coins < 0
                          ? "var(--ink)"
                          : "var(--ink-3)",
                    }}
                  >
                    {t.coins > 0 ? "+" : ""}
                    {t.coins}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
