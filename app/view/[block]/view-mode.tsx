"use client";

import { useLayoutEffect } from "react";

/**
 * Applies `?mode=dark` by toggling `.dark` on `<html>`, and `?c=<code>` (the Create page's
 * configuration) through lib/create/frame.ts, for as long as the view is mounted, as the demo
 * stage's DemoMode does. That module is imported only when there is a code. Reads
 * `location.search` instead of the `searchParams` prop so the route stays fully prerendered;
 * `data-demo-ready` tells Playwright both have been applied. Renders nothing: the page block
 * brings its own landmarks and heading.
 */
export function ViewMode() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const search = new URLSearchParams(window.location.search);
    root.classList.toggle("dark", search.get("mode") === "dark");
    const code = search.get("c");
    const done = new AbortController();
    if (code === null) root.dataset.demoReady = "true";
    else {
      // The module marks the root ready itself; a chunk that fails to load leaves the default.
      import("@/lib/create/frame").then(
        ({ followCode }) => followCode(window, code, done.signal),
        () => {
          root.dataset.demoReady = "true";
        },
      );
    }
    return () => {
      done.abort();
      root.classList.remove("dark");
      delete root.dataset.demoReady;
    };
  }, []);

  return null;
}
