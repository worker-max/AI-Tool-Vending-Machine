"use client";

import { useState } from "react";

export default function SubmitPage() {
  const [form, setForm] = useState({
    submitterEmail: "",
    submitterName: "",
    proposedSlug: "",
    proposedName: "",
    bio: "",
    glyph: "",
    shape: "sync",
    packaging: "http",
    priceCoins: 5,
    endpointUrl: "",
    inputSchema: "",
    outputSchema: "",
    exampleInput: "",
    creatorCredit: "",
  });
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "success"; id: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitterEmail: form.submitterEmail,
          submitterName: form.submitterName,
          proposedSlug: form.proposedSlug,
          proposedName: form.proposedName,
          manifest: {
            bio: form.bio,
            glyph: form.glyph,
            shape: form.shape,
            packaging: form.packaging,
            priceCoins: form.priceCoins,
            endpointUrl: form.endpointUrl || undefined,
            inputSchema: form.inputSchema,
            outputSchema: form.outputSchema,
            exampleInput: form.exampleInput,
            creatorCredit: form.creatorCredit,
          },
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setState({ kind: "success", id: json.id });
      } else {
        setState({ kind: "error", message: json.error || "Submission failed" });
      }
    } catch {
      setState({ kind: "error", message: "Network error." });
    }
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <div style={{ maxWidth: 760, margin: "32px auto" }}>
      <div className="label">Submission · Tool intake</div>
      <h1
        className="display"
        style={{ fontSize: "clamp(36px, 4vw, 56px)", marginTop: 12 }}
      >
        Add a creature to the <em>machine.</em>
      </h1>
      <p
        style={{
          marginTop: 16,
          fontSize: 16,
          color: "var(--ink-2)",
          lineHeight: 1.55,
          maxWidth: "60ch",
        }}
      >
        Submit a tool. Your manifest enters the operator review queue. If
        approved, your tool gets a slot on UNIT 014 and earns coins per pull.
      </p>

      <div
        className="card-paper"
        style={{
          marginTop: 32,
          padding: 20,
          background: "var(--tangerine-wash)",
          borderLeftWidth: 3,
          borderLeftColor: "var(--tangerine)",
        }}
      >
        <div className="label" style={{ color: "var(--tangerine)" }}>
          v1 Note
        </div>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)" }}>
          Sandbox runtime is scaffolded but not active in v1. Submitted tools
          enter the review queue and are evaluated manually. The HTTP-endpoint
          packaging path will be the first activated runtime once a partner
          tool is onboarded.
        </p>
      </div>

      {state.kind === "success" ? (
        <div
          style={{
            marginTop: 32,
            padding: 24,
            border: "1px solid var(--ink)",
          }}
        >
          <div className="label">Submitted</div>
          <h2 style={{ marginTop: 8, fontSize: 22, fontWeight: 500 }}>
            Manifest received.
          </h2>
          <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)" }}>
            Submission id <code>{state.id}</code>. We'll email{" "}
            {form.submitterEmail} when reviewed.
          </p>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          style={{ marginTop: 32, display: "grid", gap: 24 }}
        >
          <FieldsetGroup title="Submitter">
            <Field
              label="Your email"
              required
              value={form.submitterEmail}
              onChange={(v) => set("submitterEmail", v)}
              type="email"
            />
            <Field
              label="Your name"
              value={form.submitterName}
              onChange={(v) => set("submitterName", v)}
            />
            <Field
              label="Creator credit (how to display you)"
              required
              value={form.creatorCredit}
              onChange={(v) => set("creatorCredit", v)}
            />
          </FieldsetGroup>

          <FieldsetGroup title="Tool identity">
            <Field
              label="Tool name"
              required
              value={form.proposedName}
              onChange={(v) => set("proposedName", v)}
            />
            <Field
              label="Slug (lowercase, hyphens only)"
              required
              value={form.proposedSlug}
              onChange={(v) => set("proposedSlug", v)}
              placeholder="my-tool-name"
            />
            <Field
              label="Glyph (single character or short symbol)"
              required
              value={form.glyph}
              onChange={(v) => set("glyph", v)}
              placeholder="∿  ◐  ▤  ◇"
            />
            <Field
              label="Bio (1–2 sentences)"
              required
              type="textarea"
              value={form.bio}
              onChange={(v) => set("bio", v)}
            />
          </FieldsetGroup>

          <FieldsetGroup title="Runtime">
            <Field
              label="Shape"
              type="select"
              value={form.shape}
              onChange={(v) => set("shape", v)}
              options={[
                { value: "sync", label: "Sync · form-in / output-out" },
                { value: "async", label: "Async · v1.1+" },
                { value: "streaming", label: "Streaming · v1.1+" },
                { value: "voice", label: "Voice · v1.1+" },
              ]}
            />
            <Field
              label="Packaging"
              type="select"
              value={form.packaging}
              onChange={(v) => set("packaging", v)}
              options={[
                { value: "http", label: "HTTP endpoint (you self-host)" },
                {
                  value: "sandbox",
                  label: "Sandbox upload (Vercel Sandbox · v1.1+)",
                },
              ]}
            />
            {form.packaging === "http" && (
              <Field
                label="Endpoint URL"
                type="url"
                value={form.endpointUrl}
                onChange={(v) => set("endpointUrl", v)}
                placeholder="https://your-service.com/run"
              />
            )}
            <Field
              label="Price per pull (coins)"
              type="number"
              value={String(form.priceCoins)}
              onChange={(v) => set("priceCoins", parseInt(v) || 0)}
            />
          </FieldsetGroup>

          <FieldsetGroup title="Schemas + example">
            <Field
              label="Input schema (JSON Schema)"
              type="textarea"
              required
              value={form.inputSchema}
              onChange={(v) => set("inputSchema", v)}
              placeholder='{"type":"object","properties":{"text":{"type":"string"}}}'
            />
            <Field
              label="Output schema (JSON Schema)"
              type="textarea"
              required
              value={form.outputSchema}
              onChange={(v) => set("outputSchema", v)}
            />
            <Field
              label="Example input (JSON)"
              type="textarea"
              required
              value={form.exampleInput}
              onChange={(v) => set("exampleInput", v)}
            />
          </FieldsetGroup>

          <button
            type="submit"
            className="btn-lever"
            disabled={state.kind === "submitting"}
          >
            {state.kind === "submitting" ? "Submitting…" : "Submit for review"}
          </button>

          {state.kind === "error" && (
            <div
              className="mono"
              style={{
                padding: "10px 14px",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                fontSize: 12,
              }}
            >
              {state.message.toUpperCase()}
            </div>
          )}
        </form>
      )}
    </div>
  );
}

function FieldsetGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      style={{
        border: "1px solid var(--ink)",
        padding: 24,
        display: "grid",
        gap: 16,
      }}
    >
      <legend className="label" style={{ padding: "0 8px" }}>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "url" | "number" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  options,
}: FieldProps) {
  return (
    <label style={{ display: "block" }}>
      <span className="label" style={{ display: "block", marginBottom: 6 }}>
        {label}
        {required ? " ·" : " · OPTIONAL"}
      </span>
      {type === "textarea" ? (
        <textarea
          className="textarea-paper"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      ) : type === "select" && options ? (
        <select
          className="input-paper"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          className="input-paper"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}
    </label>
  );
}
