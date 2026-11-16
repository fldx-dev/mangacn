"use client";

import { type ReactNode, useSyncExternalStore, ViewTransition } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * A navigation turns the page: the next one is laid over from the right (globals.css,
 * `.page-turn`). Under reduced motion there is no turn: with the class `none` an update inside
 * the site starts no view transition, so the old page is not captured and laid over the new
 * one while it renders (a transition in flight paints only the captured viewport, and a resize,
 * such as rotating a phone or a full-page screenshot, aborts it with an error). React still
 * starts one when a page kept by cacheComponents is shown again; globals.css ends those at once.
 */
export function PageTurn({ children }: { children: ReactNode }) {
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  return <ViewTransition default={reduced ? "none" : "page-turn"}>{children}</ViewTransition>;
}
