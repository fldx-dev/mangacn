"use client";

import { useSidebar } from "fumadocs-ui/components/sidebar/base";
import { useEffect } from "react";

/**
 * Closes the phone drawer when a sidebar variant link (`#c-stamp-3`) scrolls the current page:
 * Fumadocs closes it on a new pathname only, and a hash link keeps the pathname. Next's Link
 * moves to a hash with `pushState`, which fires no `hashchange`, so the click is what counts.
 */
export function CloseDrawerOnHash() {
  const { setOpen } = useSidebar();
  useEffect(() => {
    const close = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.pathname === window.location.pathname && link.hash) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [setOpen]);
  return null;
}
