"use client";

import { useLayoutEffect } from "react";

/**
 * `PRESET_ATTRIBUTE` of lib/registry/theme-presets.ts, written out (variant-mode.test.ts holds them
 * equal): importing that module, which the docs bundle shares, makes the bundler split the
 * stage's chunks differently, so every stage's HTML would change.
 */
const PRESET_ATTRIBUTE = "data-theme-preset";

/** A preset name as the values files spell them; an unknown one matches no rule (default look). */
const PRESET_NAME = /^[a-z][a-z0-9-]*$/;

/**
 * Applies `?mode=dark` by toggling `.dark` on `<html>`, `?theme=<preset>` by setting
 * `data-theme-preset` there (the default look is no attribute), and `?c=<code>` (the Create
 * page's configuration, which wins over `?theme=`) through lib/create/frame.ts, for as long as
 * the stage is mounted. That module is imported only when there is a code, so a stage without
 * one loads what it always did. Reads `location.search` instead of the `searchParams` prop so
 * the stage stays fully prerendered; `data-variant-ready` tells Playwright all have been applied.
 *
 * Also renders the stage's accessible name. It lives here, not beside the variant, because a
 * sibling there would shift the variant's `useId` values, which seed every rough.js drawing. The
 * routes are static (MANGA-21), so the page passes the item and variant; the gallery has no variant.
 */
export function VariantMode({ item, variant }: { item: string; variant?: string }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const search = new URLSearchParams(window.location.search);
    root.classList.toggle("dark", search.get("mode") === "dark");
    const code = search.get("c");
    const preset = search.get("theme");
    if (code === null && preset && PRESET_NAME.test(preset)) {
      root.setAttribute(PRESET_ATTRIBUTE, preset);
    }
    const done = new AbortController();
    if (code === null) root.dataset.variantReady = "true";
    else {
      // The module marks the root ready itself; a chunk that fails to load leaves the default.
      import("@/lib/create/frame").then(
        ({ followCode }) => followCode(window, code, done.signal),
        () => {
          root.dataset.variantReady = "true";
        },
      );
    }
    return () => {
      done.abort();
      root.classList.remove("dark");
      root.removeAttribute(PRESET_ATTRIBUTE);
      delete root.dataset.variantReady;
    };
  }, []);

  return <span id="variant-stage-label" className="sr-only">{`${item} / ${variant}`}</span>;
}
