"use client";

import { useParams } from "next/navigation";
import { useLayoutEffect } from "react";

/**
 * `PRESET_ATTRIBUTE` of lib/registry/theme-presets.ts, written out (demo-mode.test.ts holds them
 * equal): importing that module, which the docs bundle shares, makes the bundler split the
 * stage's chunks differently, so every stage's HTML would change.
 */
const PRESET_ATTRIBUTE = "data-theme-preset";

/** A preset name as the values files spell them; an unknown one matches no rule (default look). */
const PRESET_NAME = /^[a-z][a-z0-9-]*$/;

/**
 * Applies `?mode=dark` by toggling `.dark` on `<html>`, and `?theme=<preset>` by setting
 * `data-theme-preset` there (the default look is no attribute), for as long
 * as the stage is mounted. Reads `location.search` instead of the `searchParams` prop so the
 * stage stays fully prerendered; `data-demo-ready` tells Playwright both have been applied.
 *
 * Also renders the stage's accessible name. It lives here, not beside the demo, because a
 * sibling there would shift the demo's `useId` values, which seed every rough.js drawing.
 */
export function DemoMode() {
  const { item, demo } = useParams<{ item: string; demo: string }>();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const search = new URLSearchParams(window.location.search);
    root.classList.toggle("dark", search.get("mode") === "dark");
    const preset = search.get("theme");
    if (preset && PRESET_NAME.test(preset)) root.setAttribute(PRESET_ATTRIBUTE, preset);
    root.dataset.demoReady = "true";
    return () => {
      root.classList.remove("dark");
      root.removeAttribute(PRESET_ATTRIBUTE);
      delete root.dataset.demoReady;
    };
  }, []);

  return <span id="demo-stage-label" className="sr-only">{`${item} / ${demo}`}</span>;
}
