export default function AdminPortalPage() {
  return (
    <div>
      <div className="label">Experience · Footer portal codes</div>
      <h1 style={{ marginTop: 12, fontSize: 32, fontWeight: 500 }}>
        Portal codes
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-2)", maxWidth: "60ch" }}>
        The footer portal accepts passphrases that route to hidden pages. v1
        codes are hardcoded in <code>src/components/FooterPortal.tsx</code>.
        Editable codes (operator-managed) land in v1.1.
      </p>

      <div
        style={{
          marginTop: 32,
          padding: 24,
          border: "1px solid var(--ink)",
          background: "var(--paper-2)",
          maxWidth: 480,
        }}
      >
        <div className="label" style={{ marginBottom: 12 }}>
          Active passphrases
        </div>
        <ul
          className="mono"
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            fontSize: 12,
            lineHeight: 2,
          }}
        >
          <li>
            <code>dispense intelligence</code> →{" "}
            <span style={{ color: "var(--ink-3)" }}>/lore</span>
          </li>
          <li>
            <code>unit 014</code> →{" "}
            <span style={{ color: "var(--ink-3)" }}>/lore</span>
          </li>
          <li>
            <code>the city</code> →{" "}
            <span style={{ color: "var(--ink-3)" }}>/about</span>
          </li>
        </ul>
      </div>

      <div
        style={{
          marginTop: 32,
          padding: 24,
          border: "1px solid var(--ink)",
          background: "var(--tangerine-wash)",
          maxWidth: 480,
        }}
      >
        <div className="label" style={{ color: "var(--tangerine)" }}>
          Hidden interaction
        </div>
        <p style={{ marginTop: 8, fontSize: 14 }}>
          Konami code (↑↑↓↓←→←→ B A) on any marketing page routes to{" "}
          <code>/lore?konami=1</code>.
        </p>
      </div>
    </div>
  );
}
