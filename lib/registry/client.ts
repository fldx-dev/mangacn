import { readFileSync } from "node:fs";
import path from "node:path";
import type { RegistryFile } from "./index";

/** Leading whitespace and comments, which may precede a directive. */
const LEADING_TRIVIA = /^(?:\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*/;

/** Whether `source` opens with the `"use client"` directive (comments and blank lines may come first). */
export function hasUseClientDirective(source: string): boolean {
  return /^(["'])use client\1/.test(source.replace(LEADING_TRIVIA, ""));
}

/**
 * Whether an item is a client component, read from the `"use client"` directive of its entry
 * file (the first script it ships); null for an item that ships no script (the theme, fonts).
 */
export function isClientItem(item: { files: readonly RegistryFile[] }): boolean | null {
  const entry = item.files.find((file) => /\.[cm]?[jt]sx?$/.test(file.path));
  if (!entry) return null;
  return hasUseClientDirective(readFileSync(path.resolve(entry.path), "utf8"));
}

/** The one line an item page, `get_item` and `list_items` print about it. */
export function clientNote(client: boolean): string {
  return client
    ? 'Client component: the file starts with "use client". A server component can render it, but only with serializable props (no functions).'
    : 'Server component: the file has no "use client", so it renders on the server unless a client component imports it.';
}
