// VEND/AI — Native adapter
//
// Native tools are TS modules that live in this repo. Their handler runs in
// the same Node process as the dispatcher.

import type { ToolContext, ToolDefinition } from "../contract";
import { getAnthropic } from "../../anthropic";

export async function runNative(
  definition: ToolDefinition,
  input: unknown,
  ctx: ToolContext
): Promise<unknown> {
  if (!definition.handler) {
    throw new Error(`Native tool '${definition.slug}' missing handler`);
  }

  // Lazily attach Anthropic client to context. Tools that don't need it
  // don't trigger the env-var requirement.
  const enrichedCtx: ToolContext = {
    ...ctx,
    get anthropic() {
      return getAnthropic();
    },
  } as ToolContext;

  return await definition.handler(input, enrichedCtx);
}
