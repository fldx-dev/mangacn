"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

// The site theme is `.dark` on <html>, set by next-themes; the stage takes `?mode=dark`.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains("dark");

export interface StageFrameProps {
  src: string;
  title: string;
  height: string;
  /**
   * A preview, not a live demo: the frame is inert (Tab and the pointer pass it by) and so is
   * the stage document inside it. The frame's `inert` alone does not stop a same-origin page in
   * it from focusing itself (Chromium), and a stage whose popup opens on mount would then pull
   * focus and the scroll position to the frame as it loads, and a modal would trap the Tab key.
   */
  inert?: boolean;
}

/** An iframe of a demo stage that follows the docs site's light or dark theme. */
export function StageFrame({ src, title, height, inert }: StageFrameProps) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  const ref = useRef<HTMLIFrameElement>(null);

  const frameSrc = dark ? `${src}?mode=dark` : src;

  useEffect(() => {
    const frame = ref.current;
    if (!inert || !frame) return;
    // Pin the stage document inert the moment it exists, before its scripts hydrate and open
    // anything: an element in an inert document cannot take focus, so nothing is pulled out of
    // the page. Polled per frame until the stage has loaded (a theme switch loads it again).
    let raf = 0;
    const pin = () => {
      const doc = frame.contentDocument;
      if (doc?.documentElement && doc.URL.endsWith(frameSrc)) doc.documentElement.inert = true;
    };
    const tick = () => {
      pin();
      raf = requestAnimationFrame(tick);
    };
    const onLoad = () => {
      pin();
      cancelAnimationFrame(raf);
    };
    tick();
    frame.addEventListener("load", onLoad);
    return () => {
      cancelAnimationFrame(raf);
      frame.removeEventListener("load", onLoad);
    };
  }, [inert, frameSrc]);

  return (
    <iframe
      ref={ref}
      src={frameSrc}
      title={title}
      inert={inert}
      style={{ height }}
      className="block w-full rounded-sm border bg-paper"
    />
  );
}
