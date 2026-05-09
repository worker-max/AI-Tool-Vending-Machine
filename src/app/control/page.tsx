import { eq, sql, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!db) {
    return <NoDb />;
  }

  const [toolCount, pullsToday, pendingSubmissions, activeVips, recentTx] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.tools)
        .where(eq(schema.tools.published, true)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.transactions)
        .where(
          sql`${schema.transactions.kind} IN ('pull', 'vip_pull') AND ${schema.transactions.status} = 'settled' AND ${schema.transactions.createdAt} > NOW() - INTERVAL '24 hours'`
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.toolSubmissions)
        .where(eq(schema.toolSubmissions.status, "pending")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.vipGrants)
        .where(eq(schema.vipGrants.active, true)),
      db
        .select()
        .from(schema.transactions)
        .orderBy(desc(schema.transactions.createdAt))
        .limit(10),
    ]);

  const stats = [
    { label: "Tools published", value: toolCount[0]?.count ?? 0 },
    { label: "Pulls (24h)", value: pullsToday[0]?.count ?? 0 },
    { label: "Pending submissions", value: pendingSubmissions[0]?.count ?? 0 },
    { label: "Active VIPs", value: activeVips[0]?.count ?? 0 },
  ];

  return (
    <div>
      <div className="label">Operator · Dashboard</div>
      <h1
        style={{
          marginTop: 12,
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: "-0.02em",
        }}
      >
        UNIT 014 · Status board
      </h1>

      <div
        style={{
          marginTop: 32,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              padding: 20,
              border: "1px solid var(--ink)",
              background: "var(--paper)",
            }}
          >
            <div className="label">{s.label}</div>
            <div
              style={{
                marginTop: 12,
                fontSize: 36,
                fontWeight: 300,
                letterSpacing: "-0.02em",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <h2
        style={{
          marginTop: 64,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          marginBottom: 16,
        }}
      >
        Recent transactions
      </h2>
      {recentTx.length === 0 ? (
        <p className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>
          NO TRANSACTIONS YET
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--ink)", textAlign: "left" }}>
              <th className="label" style={{ padding: "8px 0" }}>
                Time
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
            {recentTx.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
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
    </div>
  );
}

function NoDb() {
  return (
    <div>
      <div className="label">Operator · Dashboard</div>
      <h1 style={{ marginTop: 12, fontSize: 32, fontWeight: 500 }}>
        Database not configured.
      </h1>
      <p style={{ marginTop: 16, color: "var(--ink-2)" }}>
        Set <code>DATABASE_URL</code> and run <code>npm run db:push</code> to
        get started.
      </p>
    </div>
  );
}
