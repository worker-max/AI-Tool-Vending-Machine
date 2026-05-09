// VEND/AI — Tool registry contract
//
// Every tool — Colin's native modules, partner HTTP endpoints, public sandbox
// submissions — implements this contract. The dispatcher routes by `packaging`
// to the correct adapter, which knows how to invoke that kind of tool.

import type { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";

export type ToolShape = "sync" | "async" | "streaming" | "voice";
export type ToolPackaging = "native" | "http" | "sandbox";

export interface ToolPricingFlat {
  kind: "flat";
  coins: number;
}

// Reserved for v1.1+ — registry permits this shape so tools can opt in later.
export interface ToolPricingHybrid {
  kind: "hybrid";
  baseCoins: number;
  baseUnit: number;
  overflowCoins: number;
  overflowUnit: number;
}

export type ToolPricing = ToolPricingFlat | ToolPricingHybrid;

export interface ToolPersona {
  name: string;
  glyph: string; // editorial silhouette — single char, SVG path, or short string
  bio: string;
  accentColor?: string;
  voiceProfile?: string;
  creatorCredit: string;
}

/**
 * Context passed to a tool handler at run time. Adapters populate this from
 * the dispatch call.
 */
export interface ToolContext {
  userId: string;
  walletId: string;
  /** Anthropic SDK client. Only set if the tool's runtime needs it. */
  anthropic?: Anthropic;
  /** Logger that writes to server console with the tool slug as prefix. */
  log: (msg: string, ...rest: unknown[]) => void;
}

/**
 * The full registered tool. Tool definitions internally use `z.infer<schema>`
 * to type their handler input/output; the registry treats them as `unknown`.
 */
export interface ToolDefinition {
  slug: string;
  shape: ToolShape;
  packaging: ToolPackaging;
  pricing: ToolPricing;
  persona: ToolPersona;
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  /** Native handler (in-process). Required when packaging === 'native'. */
  handler?: (input: unknown, ctx: ToolContext) => Promise<unknown>;
  /** HTTP endpoint config. Required when packaging === 'http'. */
  endpoint?: {
    url: string;
    auth: "hmac";
    secretEnvKey: string;
  };
  /** Sandbox manifest reference. Required when packaging === 'sandbox'. */
  sandboxRef?: {
    manifestPath: string;
  };
}

export interface DispatchSuccess<O = unknown> {
  ok: true;
  output: O;
  coinsCharged: number;
  vip: boolean;
}

export interface DispatchFailure {
  ok: false;
  error:
    | "TOOL_NOT_FOUND"
    | "TOOL_NOT_PUBLISHED"
    | "INVALID_INPUT"
    | "INSUFFICIENT_COINS"
    | "TOOL_FAILURE"
    | "NOT_AUTHENTICATED"
    | "ADAPTER_NOT_AVAILABLE";
  message: string;
}

export type DispatchResult<O = unknown> = DispatchSuccess<O> | DispatchFailure;
