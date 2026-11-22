/**
 * The pages the Create page's preview tabs frame (Task C5), and the URL each loads: a page
 * block's view, or a block's variant stage where it has no page of its own (the chat thread). A
 * plain module, so the e2e suite reads the same list.
 */

import type { Mode } from "@/lib/registry/contrast";
import { CODE_PARAM } from "./state";

/** The pages the preview tabs show, in tab order, after the specimen. */
export const PREVIEW_PAGES = [
  { id: "login", label: "Login", block: "login-01", path: "/view/login-01" },
  { id: "app-shell", label: "App shell", block: "sidebar-07", path: "/view/sidebar-07" },
  { id: "series", label: "Series page", block: "series-page", path: "/view/series-page" },
  { id: "chat", label: "Chat", block: "chat-thread", path: "/gallery/chat-thread/default" },
] as const;

export type PreviewPage = (typeof PREVIEW_PAGES)[number];

/** A preview page at a code and a mode. The code is a canonical one, never typed text. */
export function previewUrl(page: PreviewPage, code: string, mode: Mode): string {
  const search = new URLSearchParams({ [CODE_PARAM]: code });
  if (mode === "dark") search.set("mode", "dark");
  return `${page.path}?${search}`;
}
