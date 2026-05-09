"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const redirect = searchParams.get("redirect") || "/arcade";

  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "sending" }
    | { kind: "sent"; devLink?: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirect }),
      });
      const json = await res.json();
      if (json.ok) {
        setState({ kind: "sent", devLink: json.devLink });
      } else {
        setState({
          kind: "error",
          message:
            json.error === "INVALID_EMAIL"
              ? "That email doesn't look right."
              : "Something went wrong sending your link.",
        });
      }
    } catch {
      setState({ kind: "error", message: "Network error." });
    }
  }

  const errorMessage = errorParam
    ? {
        missing_token: "Missing sign-in token.",
        invalid_token: "That link is invalid.",
        expired: "That link expired. Try again.",
        already_used: "That link was already used.",
        database_not_configured: "Database not configured.",
      }[errorParam] || `Error: ${errorParam}`
    : null;

  return (
    <div style={{ maxWidth: 480, margin: "64px auto", padding: "0 16px" }}>
      <div className="label" style={{ marginBottom: 16 }}>
        Sign in · Magic link
      </div>
      <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
        Insert <em>coin.</em>
      </h1>
      <p
        style={{
          marginTop: 16,
          fontSize: 16,
          lineHeight: 1.55,
          color: "var(--ink-2)",
          maxWidth: "44ch",
        }}
      >
        Enter your email. We'll send a link that signs you in. New visitors
        get 10 free coins on first sign-in.
      </p>

      {errorMessage && (
        <div
          className="mono"
          style={{
            marginTop: 24,
            padding: "10px 14px",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            fontSize: 12,
          }}
        >
          {errorMessage.toUpperCase()}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ marginTop: 32 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="input-paper"
          disabled={state.kind === "sending" || state.kind === "sent"}
        />
        <button
          type="submit"
          className="btn-lever"
          style={{ marginTop: 16, width: "100%" }}
          disabled={state.kind === "sending" || state.kind === "sent"}
        >
          {state.kind === "sending"
            ? "Sending…"
            : state.kind === "sent"
            ? "Link sent — check your email"
            : "Send sign-in link"}
        </button>
      </form>

      {state.kind === "sent" && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            border: "1px solid var(--ink)",
            background: "var(--paper-2)",
          }}
        >
          <div className="label">Sent</div>
          <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)" }}>
            Check {email} for a link. It expires in 15 minutes and works once.
          </p>
          {state.devLink && (
            <>
              <div
                className="label"
                style={{ marginTop: 16, color: "var(--tangerine)" }}
              >
                Dev mode · click below
              </div>
              <a
                href={state.devLink}
                className="mono"
                style={{
                  display: "block",
                  marginTop: 6,
                  fontSize: 11,
                  color: "var(--tangerine)",
                  wordBreak: "break-all",
                }}
              >
                {state.devLink}
              </a>
            </>
          )}
        </div>
      )}

      {state.kind === "error" && (
        <div
          className="mono"
          style={{
            marginTop: 16,
            padding: "10px 14px",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            fontSize: 12,
          }}
        >
          {state.message.toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
