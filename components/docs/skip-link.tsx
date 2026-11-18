"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Fumadocs' own ids for a page's content, most specific first (the docs article, the home main). */
const TARGETS = ["nd-page", "nd-home-layout"];

/**
 * The first tab stop of every site page: skips the navbar to the page's own content. The link
 * points at the id Fumadocs already gives that content; it never adds nodes to the page, which
 * would break hydration of the parts still streaming in.
 */
export function SkipLink() {
  const pathname = usePathname();
  // Right from the server's HTML: a link to an id the page lacks is not a skip link to axe, which
  // then flags it as content outside any landmark until the effect below corrects it.
  const [target, setTarget] = useState(pathname.startsWith("/docs") ? TARGETS[0] : TARGETS[1]);
  useEffect(() => {
    // Re-run on every navigation: a docs page has the article, the home and Create the main.
    void pathname;
    setTarget(TARGETS.find((id) => document.getElementById(id)) ?? TARGETS[1]);
  }, [pathname]);

  return (
    <a
      href={`#${target}`}
      className="sr-only z-100 bg-ink px-4 py-3 font-display text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      Skip to content
    </a>
  );
}
