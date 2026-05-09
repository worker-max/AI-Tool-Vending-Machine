// VEND/AI — Anthropic client (used by Native tool handlers in v1)
//
// In v1 every Native tool calls Claude directly. The registry contract
// supports any provider, but the launch lineup is Claude-only.

import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (cached) return cached;

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Set it in .env.local or Vercel project settings."
    );
  }

  cached = new Anthropic({ apiKey: key });
  return cached;
}

/**
 * The default Claude model for v1 tools. Claude Sonnet 4.6 — a quality/cost
 * balance for the kinds of small, fast tools the arcade dispenses.
 */
export const DEFAULT_MODEL = "claude-sonnet-4-6";
