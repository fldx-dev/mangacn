/**
 * `?c=<code>` on the demo stage and the block view (Task C5): the page's root takes the
 * configuration's preview variables, as the Create page's preview wrapper does, and follows a
 * new code the Create page posts to it. The stage and view mode components import this module
 * only when the URL has a code, so a page without one loads and renders exactly what it did.
 *
 * Nothing from the URL or a message reaches the page but the numbers and names `decode`
 * checked: a code that does not decode is the default look.
 */

import { CREATE_FONT_CLASSES } from "@/components/create/create-fonts";
import { decode, MAX_CODE_LENGTH } from "./code";
import { previewVariables } from "./preview";

/**
 * `INK_REDRAW_EVENT` of registry/theme/ink-frame, written out (frame.test.ts holds them equal):
 * importing ink-frame here puts a module the views also load into this lazy chunk, and the
 * bundler then splits the views' own chunks differently, so their HTML would change without `?c=`.
 */
export const REDRAW_EVENT = "mangacn:ink-redraw";

/** The message the Create page posts to a frame: `{ type, code }`, the canonical code only. */
export const CODE_MESSAGE = "mangacn:create-code";

/** The message a frame posts to its parent once it listens, so the parent sends its code. */
export const READY_MESSAGE = "mangacn:create-ready";

/** A message of ours from the Create page: the code as a string no longer than any code. */
export function codeFromMessage(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const { type, code } = data as { type?: unknown; code?: unknown };
  if (type !== CODE_MESSAGE || typeof code !== "string" || code.length > MAX_CODE_LENGTH) {
    return null;
  }
  return code;
}

/**
 * Sets the variables of `code` on `root` in the root's mode (`.dark` or not), replacing those a
 * previous code set; a bad code clears them (the default look). Returns the names it set.
 */
export function applyCode(
  root: HTMLElement,
  code: string,
  previous: readonly string[] = [],
): string[] {
  for (const name of previous) root.style.removeProperty(name);
  const result = decode(code);
  if (!result.ok) return [];
  const mode = root.classList.contains("dark") ? "dark" : "light";
  const vars = previewVariables(result.config, mode);
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  return Object.keys(vars);
}

/**
 * Applies `code` (from `win`'s URL) to its document's root, adds the classes that load the extra
 * faces, and while embedded follows the codes its parent posts (same origin, from the parent
 * only); then marks the root `data-demo-ready`. Until `signal` aborts: then the root is restored
 * (the mode component removes the ready mark). Does nothing once aborted.
 */
export function followCode(win: Window, code: string, signal: AbortSignal): void {
  if (signal.aborted) return;
  const root = win.document.documentElement;
  const fontClasses = CREATE_FONT_CLASSES.split(" ").filter(Boolean);
  root.classList.add(...fontClasses);
  let set = applyCode(root, code);
  let current = code;

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== win.location.origin || event.source !== win.parent) return;
    const next = codeFromMessage(event.data);
    if (next === null || next === current) return;
    current = next;
    set = applyCode(root, next, set);
    // The pen reaches the drawings only when they draw.
    root.dispatchEvent(new Event(REDRAW_EVENT, { bubbles: true }));
  };

  if (win.parent !== win) {
    win.addEventListener("message", onMessage, { signal });
    win.parent.postMessage({ type: READY_MESSAGE }, win.location.origin);
  }
  signal.addEventListener("abort", () => {
    for (const name of set) root.style.removeProperty(name);
    root.classList.remove(...fontClasses);
  });
  root.dataset.demoReady = "true";
}
