import { brand } from "@/lib/brand.config";

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="label">System · Settings</div>
      <h1 style={{ marginTop: 12, fontSize: 32, fontWeight: 500 }}>
        Operator settings
      </h1>

      <div style={{ marginTop: 32, display: "grid", gap: 24, maxWidth: 720 }}>
        <SettingRow label="Site name" value={brand.name} />
        <SettingRow label="Tagline" value={brand.tagline} />
        <SettingRow label="Domain" value={brand.domain} />
        <SettingRow label="Unit number" value={brand.unitNumber} />
        <SettingRow label="Collections prefix" value={brand.collections.prefix} />
        <SettingRow
          label="Theme dial active modes"
          value="Primary (only)"
        />
        <SettingRow
          label="Public submission"
          value={brand.features.submissions ? "Open" : "Closed"}
        />
        <SettingRow
          label="HTTP packaging adapter"
          value={brand.features.httpAdapter ? "Active" : "Scaffolded · v1.1"}
        />
        <SettingRow
          label="Sandbox packaging adapter"
          value={brand.features.sandboxAdapter ? "Active" : "Scaffolded · v1.1"}
        />
        <SettingRow
          label="Stripe pack purchases"
          value={brand.features.stripePackPurchases ? "Active" : "Scaffolded · v1.1"}
        />
      </div>

      <p
        style={{
          marginTop: 48,
          fontSize: 13,
          color: "var(--ink-3)",
          maxWidth: "60ch",
        }}
      >
        v1 settings are read-only — driven by{" "}
        <code>src/lib/brand.config.ts</code>. Editable settings (theme dial
        config, footer-portal codes, easter-egg toggles) land in v1.1.
      </p>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 2fr",
        gap: 24,
        padding: "12px 0",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <div className="label">{label}</div>
      <div style={{ fontSize: 14, color: "var(--ink)" }}>{value}</div>
    </div>
  );
}
