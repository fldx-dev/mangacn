"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/** Whether the variants mount at once: no observer to wait on, or the reader asked to save data. */
function mountAtOnce(): boolean {
  if (typeof IntersectionObserver === "undefined") return true;
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-data: reduce)").matches
  );
}

export interface LazyVariantProps {
  /** The live variant (server-rendered, mounted on the client once near the screen). */
  children: ReactNode;
  /** The variant box's height, the same before and after the variant mounts. */
  height: string;
}

/**
 * A live variant that mounts only when its box comes within one viewport height of the screen
 * (SPEC-components-3 §3, "lazy cards"). Until then the box is an empty paper placeholder of
 * the variant's own height, so nothing below it moves when the variant arrives. `data-mounted`
 * says which state it is in. Without `IntersectionObserver`, or under
 * `prefers-reduced-data: reduce`, every variant mounts at once.
 */
export function LazyVariant({ children, height }: LazyVariantProps) {
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
    <div ref={ref} data-slot="lazy-variant" data-mounted={mounted} style={{ height }}>
      {mounted ? (
        children
      ) : (
        <div
          data-slot="lazy-variant-placeholder"
          className="h-full w-full rounded-sm border bg-paper"
        />
      )}
    </div>
  );
}
