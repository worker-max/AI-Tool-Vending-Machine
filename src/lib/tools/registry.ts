// VEND/AI — Tool registry
//
// In v1, native tools are statically imported here. HTTP and sandbox tools
// are loaded from the database (`va_tools` rows) at dispatch time.

import type { ToolDefinition } from "./contract";
import { editorialRewriter } from "./definitions/editorial-rewriter";
import { urlBullets } from "./definitions/url-bullets";

const nativeTools: Record<string, ToolDefinition> = {
  [editorialRewriter.slug]: editorialRewriter as ToolDefinition,
  [urlBullets.slug]: urlBullets as ToolDefinition,
};

export function getNativeTool(slug: string): ToolDefinition | null {
  return nativeTools[slug] ?? null;
}

export function listNativeTools(): ToolDefinition[] {
  return Object.values(nativeTools);
}
