"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  toolSlug: string;
  toolName: string;
  priceCoins: number;
  inputs: InputField[];
  authenticated: boolean;
}

export interface InputField {
  name: string;
  label: string;
  type: "text" | "textarea" | "url" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

type RunState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "success"; output: unknown; coinsCharged: number; vip: boolean }
  | { kind: "error"; message: string };

export function ToolRunner({
  toolSlug,
  toolName,
  priceCoins,
  inputs,
  authenticated,
}: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(inputs.map((f) => [f.name, f.defaultValue ?? ""]))
  );
  const [state, setState] = useState<RunState>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authenticated) {
      router.push(
        `/auth/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }
    setState({ kind: "running" });
    try {
      const res = await fetch(`/api/tools/${toolSlug}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: values }),
      });
      const json = await res.json();
      if (json.ok) {
        setState({
          kind: "success",
          output: json.output,
          coinsCharged: json.coinsCharged,
          vip: json.vip,
        });
        router.refresh(); // refresh balance in header
      } else {
        setState({
          kind: "error",
          message: json.message || json.error || "Something went wrong",
        });
      }
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
        {inputs.map((field) => (
          <label key={field.name} style={{ display: "block" }}>
            <span
              className="label"
              style={{ display: "block", marginBottom: 6 }}
            >
              {field.label}
              {field.required ? " ·" : " · OPTIONAL"}
            </span>
            {field.type === "textarea" ? (
              <textarea
                className="textarea-paper"
                value={values[field.name]}
                onChange={(e) =>
                  setValues({ ...values, [field.name]: e.target.value })
                }
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : field.type === "select" && field.options ? (
              <select
                className="input-paper"
                value={values[field.name]}
                onChange={(e) =>
                  setValues({ ...values, [field.name]: e.target.value })
                }
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                className="input-paper"
                value={values[field.name]}
                onChange={(e) =>
                  setValues({ ...values, [field.name]: e.target.value })
                }
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
          </label>
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            type="submit"
            className="btn-lever"
            disabled={state.kind === "running"}
          >
            {state.kind === "running" ? "Working…" : "Pull lever"}
          </button>
          <span
            className="mono"
            style={{ color: "var(--ink-3)", fontSize: 11 }}
          >
            COST · {priceCoins} COIN{priceCoins === 1 ? "" : "S"} (${(
              priceCoins / 100
            ).toFixed(2)})
          </span>
        </div>
      </form>

      <DispenseTray state={state} toolName={toolName} />
    </div>
  );
}

function DispenseTray({
  state,
  toolName,
}: {
  state: RunState;
  toolName: string;
}) {
  return (
    <div
      style={{
        marginTop: 32,
        padding: 24,
        border: "1px solid var(--ink)",
        background: "var(--paper-2)",
        minHeight: 120,
      }}
    >
      <div className="label" style={{ marginBottom: 12 }}>
        Dispense tray
      </div>
      {state.kind === "idle" && (
        <div className="mono" style={{ color: "var(--ink-3)", fontSize: 12 }}>
          TRAY READY
        </div>
      )}
      {state.kind === "running" && (
        <div className="mono" style={{ color: "var(--tangerine)", fontSize: 12 }}>
          {toolName.toUpperCase()} ·{" "}
          <span style={{ animation: "blink 1s steps(2) infinite" }}>
            WORKING…
          </span>
        </div>
      )}
      {state.kind === "error" && (
        <div
          className="mono"
          style={{ color: "var(--danger)", fontSize: 12, lineHeight: 1.6 }}
        >
          ERROR · {state.message}
        </div>
      )}
      {state.kind === "success" && (
        <div className="dispense-reveal">
          <div
            className="mono"
            style={{
              color: "var(--success)",
              fontSize: 11,
              letterSpacing: "0.1em",
              marginBottom: 16,
            }}
          >
            DISPENSED · {state.coinsCharged} COIN{state.coinsCharged === 1 ? "" : "S"}
            {state.vip ? " · VIP" : ""}
          </div>
          <DispenseOutput output={state.output} />
        </div>
      )}
    </div>
  );
}

function DispenseOutput({ output }: { output: unknown }) {
  if (output && typeof output === "object" && "rewritten" in output) {
    return (
      <p
        style={{
          fontFamily: "var(--font-source-serif), Georgia, serif",
          fontSize: 18,
          lineHeight: 1.6,
          color: "var(--ink)",
        }}
      >
        {String((output as { rewritten: string }).rewritten)}
      </p>
    );
  }
  if (
    output &&
    typeof output === "object" &&
    "bullets" in output &&
    Array.isArray((output as { bullets: unknown[] }).bullets)
  ) {
    const o = output as { bullets: string[]; source_title?: string };
    return (
      <div>
        {o.source_title && (
          <div className="label" style={{ marginBottom: 12 }}>
            {o.source_title}
          </div>
        )}
        <ul style={{ paddingLeft: 0, listStyle: "none" }}>
          {o.bullets.map((b, i) => (
            <li
              key={i}
              style={{
                paddingLeft: 24,
                position: "relative",
                marginBottom: 10,
                fontSize: 16,
                lineHeight: 1.55,
                color: "var(--ink)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  color: "var(--tangerine)",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                {(i + 1).toString().padStart(2, "0")}
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <pre
      className="mono"
      style={{ fontSize: 12, whiteSpace: "pre-wrap", color: "var(--ink-2)" }}
    >
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}
