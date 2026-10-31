"use client";

import { useEffect, useState } from "react";

/** An iframe of a demo stage that forwards `?mode=dark` from the page it sits on. */
export function StageFrame({ src, title }: { src: string; title: string }) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    const dark = new URLSearchParams(window.location.search).get("mode") === "dark";
    setQuery(dark ? "?mode=dark" : "");
  }, []);
  return (
    <iframe
      src={`${src}${query}`}
      title={title}
      className="ink-border h-128 w-full rounded-[var(--radius)] bg-paper"
    />
  );
}
