"use client";

import { useLayoutEffect } from "react";
import { applyPreset, PRESET_SCRIPT, readStoredPreset } from "@/lib/registry/theme-presets";

/**
 * How many roots are mounted. Streaming can mount the docs layout twice and drop one copy (seen
 * at phone width), so a root clears the preset only when it is the last one to go.
 */
let mounted = 0;

/**
 * Keeps the reader's theme preset (the Theming page's switch) on every docs page. The inline
 * script sets `data-theme-preset` on `<html>` while the page is parsed, before the first paint,
 * so a stored preset never flashes the default look. React does not run a script it renders on
 * the client, so the layout effect applies the preset after a client navigation into the docs,
 * and the last root to unmount clears it (the landing keeps the default look), a task later so
 * that a root mounted in the same commit keeps it.
 *
 * Rendered as the docs header's `nav.children`, an otherwise empty slot: no sibling is added
 * beside any outlined content, so no `useId`-seeded drawing moves.
 */
export function ThemePresetRoot() {
  useLayoutEffect(() => {
    mounted += 1;
    applyPreset(readStoredPreset());
    return () => {
      mounted -= 1;
      setTimeout(() => {
        if (mounted === 0) applyPreset(null);
      });
    };
  }, []);

  // biome-ignore lint/security/noDangerouslySetInnerHtml: a constant script of our own
  return <script dangerouslySetInnerHTML={{ __html: PRESET_SCRIPT }} />;
}
