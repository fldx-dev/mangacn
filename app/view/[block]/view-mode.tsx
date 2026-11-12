"use client";

import { useLayoutEffect } from "react";

/**
 * Applies `?mode=dark` by toggling `.dark` on `<html>` for as long as the view is mounted, as the
 * demo stage's DemoMode does. Reads `location.search` instead of the `searchParams` prop so the
 * route stays fully prerendered; `data-demo-ready` tells Playwright the mode has been applied.
 * Renders nothing: the page block brings its own landmarks and heading.
 */
export function ViewMode() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const dark = new URLSearchParams(window.location.search).get("mode") === "dark";
    root.classList.toggle("dark", dark);
    root.dataset.demoReady = "true";
    return () => {
      root.classList.remove("dark");
      delete root.dataset.demoReady;
    };
  }, []);

  return null;
}
