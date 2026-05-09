// VEND/AI — Sandbox adapter (scaffolded; not fully wired in v1)
//
// Vercel Sandbox (Firecracker microVMs) for executing untrusted submitted code.
// v1 stores submissions in the queue but does not run them.

import type { ToolContext, ToolDefinition } from "../contract";

export async function runSandbox(
  _definition: ToolDefinition,
  _input: unknown,
  _ctx: ToolContext
): Promise<unknown> {
  throw new Error(
    "Sandbox adapter not enabled in v1. Submissions enter the review queue but cannot be executed yet. Wire to Vercel Sandbox in v1.1+."
  );
}
