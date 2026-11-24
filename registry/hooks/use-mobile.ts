import * as React from "react";

// Based on shadcn/ui use-mobile (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-11.
// Changed for mangacn: read through useSyncExternalStore instead of state set in an effect, so the
// hook passes the React Compiler lint of a Next 16 app (react-hooks/set-state-in-effect). Same
// API and result: the hook stock's sidebar reads to swap its rail for a sheet on phones, false on
// the server and on the hydrating render.

const MOBILE_BREAKPOINT = 768;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
