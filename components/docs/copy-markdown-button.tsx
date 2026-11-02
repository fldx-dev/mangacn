"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/registry/ui/button/button";

const CONFIRM_MS = 2000;

const cache = new Map<string, string>();

async function fetchMarkdown(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached !== undefined) return cached;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  const text = await response.text();
  cache.set(url, text);
  return text;
}

/**
 * Copies the page's Markdown (the `.md` route) and says so for two seconds. The clipboard
 * item takes the fetch as a promise, so Safari still sees the write inside the click.
 */
export function CopyMarkdownButton({ markdownUrl }: { markdownUrl: string }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeout = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timeout.current), []);

  const copy = async () => {
    setLoading(true);
    try {
      const text = fetchMarkdown(markdownUrl);
      if (typeof ClipboardItem === "undefined") {
        await navigator.clipboard.writeText(await text);
      } else {
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": text })]);
      }
    } catch {
      // A failed fetch or a denied clipboard: the label stays "Copy Markdown".
      return;
    } finally {
      setLoading(false);
    }
    setCopied(true);
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setCopied(false), CONFIRM_MS);
  };

  return (
    <Button variant="outline" size="sm" data-slot="copy-markdown" disabled={loading} onClick={copy}>
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span aria-live="polite">{copied ? "Copied Markdown" : "Copy Markdown"}</span>
    </Button>
  );
}
