import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLedgerPage() {
  const transactions = db
    ? await db
        .select()
        .from(schema.transactions)
        .orderBy(desc(schema.transactions.createdAt))
        .limit(200)
    : [];

  return (
    <div>
      <div className="label">System · Wallet ledger</div>
      <h1 style={{ marginTop: 12, fontSize: 32, fontWeight: 500 }}>
        Last 200 transactions
      </h1>

      <table style={{ marginTop: 32, width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--ink)", textAlign: "left" }}>
            <th className="label" style={{ padding: "8px 0" }}>Time</th>
            <th className="label" style={{ padding: "8px 0" }}>Wallet</th>
            <th className="label" style={{ padding: "8px 0" }}>Kind</th>
            <th className="label" style={{ padding: "8px 0" }}>Tool</th>
            <th className="label" style={{ padding: "8px 0" }}>Status</th>
            <th className="label" style={{ padding: "8px 0", textAlign: "right" }}>
              Coins
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td className="mono" style={{ padding: "8px 0", fontSize: 11, color: "var(--ink-3)" }}>
                {new Date(t.createdAt).toLocaleString()}
              </td>
              <td className="mono" style={{ padding: "8px 0", fontSize: 10, color: "var(--ink-3)" }}>
                {t.walletId.slice(0, 8)}…
              </td>
              <td className="mono" style={{ padding: "8px 0", fontSize: 11 }}>
                {t.kind.toUpperCase()}
              </td>
              <td style={{ padding: "8px 0", fontSize: 13 }}>
                {t.toolSlug || "—"}
              </td>
              <td className="mono" style={{ padding: "8px 0", fontSize: 11 }}>
                {t.status.toUpperCase()}
              </td>
              <td
                style={{
                  padding: "8px 0",
                  fontSize: 13,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {t.coins > 0 ? "+" : ""}
                {t.coins}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
