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
 * `.page-turn`). Under reduced motion there is no turn at all, not a still one: with the class
 * `none` React never calls `document.startViewTransition`, so the old page is not captured and
 * laid over the new one while it renders. A transition in flight paints only the captured
 * viewport, and a resize (rotating a phone, a full-page screenshot) aborts it with an error.
 */
export function PageTurn({ children }: { children: ReactNode }) {
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  return <ViewTransition default={reduced ? "none" : "page-turn"}>{children}</ViewTransition>;
}
