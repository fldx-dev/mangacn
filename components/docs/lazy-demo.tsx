"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/** Whether the demos mount at once: no observer to wait on, or the reader asked to save data. */
function mountAtOnce(): boolean {
  if (typeof IntersectionObserver === "undefined") return true;
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-data: reduce)").matches
  );
}

export interface LazyDemoProps {
  /** The live demo (server-rendered, mounted on the client once near the screen). */
  children: ReactNode;
  /** The demo box's height, the same before and after the demo mounts. */
  height: string;
}

/**
 * A live demo that mounts only when its box comes within one viewport height of the screen
 * (SPEC-components-3 §3, "lazy cards"). Until then the box is an empty paper placeholder of
 * the demo's own height, so nothing below it moves when the demo arrives. `data-mounted`
 * says which state it is in. Without `IntersectionObserver`, or under
 * `prefers-reduced-data: reduce`, every demo mounts at once.
 */
export function LazyDemo({ children, height }: LazyDemoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (mountAtOnce()) {
      setMounted(true);
      return;
    }
    // A margin of one viewport height above and below the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-slot="lazy-demo" data-mounted={mounted} style={{ height }}>
      {mounted ? (
        children
      ) : (
        <div
          data-slot="lazy-demo-placeholder"
          className="h-full w-full rounded-sm border bg-paper"
        />
      )}
    </div>
  );
}
