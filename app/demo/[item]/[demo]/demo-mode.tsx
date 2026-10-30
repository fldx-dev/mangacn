"use client";

import { useLayoutEffect } from "react";

/**
 * Applies `?mode=dark` by toggling `.dark` on `<html>` for as long as the stage is mounted.
 * Reads `location.search` instead of the `searchParams` prop so the stage stays fully
 * prerendered; `data-demo-ready` tells Playwright the mode has been applied.
 */
export function DemoMode() {
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
