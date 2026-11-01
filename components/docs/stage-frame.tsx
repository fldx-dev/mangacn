"use client";

import { useSyncExternalStore } from "react";

// The site theme is `.dark` on <html>, set by next-themes; the stage takes `?mode=dark`.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains("dark");

/** An iframe of a demo stage that follows the docs site's light or dark theme. */
export function StageFrame({ src, title, height }: { src: string; title: string; height: string }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  return (
    <iframe
      src={dark ? `${src}?mode=dark` : src}
      title={title}
      style={{ height }}
      className="block w-full rounded-sm border bg-paper"
    />
  );
}
