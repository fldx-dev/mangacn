"use client";

import { Check, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/registry/ui/button/button";

const CONFIRM_MS = 2000;

/** Writes `prompt` to the clipboard and says so for two seconds. */
export function CopyPromptButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timeout.current), []);

  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setCopied(false), CONFIRM_MS);
  };

  return (
    <Button variant="outline" size="sm" data-slot="copy-prompt" onClick={copy}>
      {copied ? <Check aria-hidden /> : <Sparkles aria-hidden />}
      <span aria-live="polite">{copied ? "Copied prompt" : "Copy prompt for AI"}</span>
    </Button>
  );
}
