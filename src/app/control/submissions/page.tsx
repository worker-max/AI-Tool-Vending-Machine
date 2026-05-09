import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const submissions = db
    ? await db
        .select()
        .from(schema.toolSubmissions)
        .orderBy(desc(schema.toolSubmissions.createdAt))
    : [];

  return (
    <div>
      <div className="label">Content · Submissions</div>
      <h1
        style={{
          marginTop: 12,
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: "-0.02em",
        }}
      >
        Submission queue ({submissions.length})
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-2)" }}>
        Public submissions land here. v1 supports manual review; the
        sandbox-runtime "test the manifest" button is v1.1.
      </p>

      <div style={{ marginTop: 32, display: "grid", gap: 16 }}>
        {submissions.length === 0 && (
          <p
            className="mono"
            style={{ color: "var(--ink-3)", fontSize: 12 }}
          >
            NO SUBMISSIONS YET
          </p>
        )}
        {submissions.map((s) => (
          <div
            key={s.id}
            style={{
              padding: 20,
              border: "1px solid var(--ink)",
              background: "var(--paper)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  {new Date(s.createdAt).toLocaleString()} · {s.submitterEmail}
                </div>
                <h3
                  style={{
                    marginTop: 4,
                    fontSize: 20,
                    fontWeight: 500,
                  }}
                >
                  {s.proposedName}{" "}
                  <span
                    className="mono"
                    style={{ fontSize: 12, color: "var(--ink-3)" }}
                  >
                    /{s.proposedSlug}
                  </span>
                </h3>
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  border: "1px solid var(--ink)",
                  color:
                    s.status === "approved"
                      ? "var(--success)"
                      : s.status === "rejected"
                      ? "var(--danger)"
                      : "var(--ink-2)",
                }}
              >
                {s.status.toUpperCase()}
              </div>
            </div>
            <details style={{ marginTop: 12 }}>
              <summary
                className="mono"
                style={{ fontSize: 11, cursor: "pointer", color: "var(--ink-3)" }}
              >
                Manifest
              </summary>
              <pre
                className="mono"
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  padding: 12,
                  background: "var(--paper-2)",
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(s.manifest, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
