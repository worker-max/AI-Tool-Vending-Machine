import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMachinesPage() {
  const machines = db ? await db.select().from(schema.machines) : [];

  return (
    <div>
      <div className="label">Content · Machines</div>
      <h1 style={{ marginTop: 12, fontSize: 32, fontWeight: 500 }}>
        Machine fleet ({machines.length})
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-2)" }}>
        v1 ships with a single machine. Schema models n; additional units land
        in v1.1.
      </p>

      <div style={{ marginTop: 32, display: "grid", gap: 16 }}>
        {machines.map((m) => (
          <div
            key={m.id}
            style={{
              padding: 20,
              border: "1px solid var(--ink)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                {m.unitNumber}
              </div>
              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 500 }}>
                {m.displayName}
              </div>
            </div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: m.online ? "var(--success)" : "var(--ink-3)",
              }}
            >
              {m.online ? "ONLINE" : "OFFLINE"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
