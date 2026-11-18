"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useLayoutEffect, useState, ViewTransition } from "react";

/**
 * A navigation turns the page: the next one is laid over from the right (globals.css,
 * `.page-turn`); under reduced motion it is a plain swap.
 *
 * Only the commit that shows another path turns it. React animates a `<ViewTransition>` on every
 * Transition and Suspense reveal that reaches it with a class other than `none`: with a fixed
 * class a page load turned the page three times (the server's reveal script as the streamed
 * content arrived, and twice after hydration) and a navigation twice. A turn paints only the
 * viewport it captured until it ends, and a resize (a full-page screenshot, a phone turned)
 * aborts it (MANGA-15). So the class is `page-turn` only while the path being rendered is not
 * the one on screen: React reads it from the rendered props, so the navigation's own commit
 * turns the page, and the layout effect puts it back to `none` before the next one. The server
 * renders `none`, so the reveal script starts no transition.
 */
export function PageTurn({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [shown, setShown] = useState(pathname);
  useLayoutEffect(() => {
    setShown(pathname);
  }, [pathname]);
  return (
    <ViewTransition default={shown === pathname ? "none" : "page-turn"}>{children}</ViewTransition>
  );
}
