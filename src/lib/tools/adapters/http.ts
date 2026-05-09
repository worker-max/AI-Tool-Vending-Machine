// VEND/AI — HTTP adapter (scaffolded; not fully wired in v1)
//
// Trusted partner endpoints. v1 ships the adapter file but no live partner.
// When a partner is onboarded post-v1, this becomes the proxy.

import type { ToolContext, ToolDefinition } from "../contract";

export async function runHttp(
  _definition: ToolDefinition,
  _input: unknown,
  _ctx: ToolContext
): Promise<unknown> {
  throw new Error(
    "HTTP adapter not enabled in v1. Scaffolded for partner onboarding in v1.1+."
  );
}
