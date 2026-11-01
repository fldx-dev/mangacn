"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/registry/ui/button/button";

const CONFIRM_MS = 2000;

export interface CopyButtonProps {
  /** What lands on the clipboard. */
  text: string;
  /** The button's accessible name, e.g. "Copy install command for Button". */
  label: string;
  className?: string;
}

/** A small ghost button that writes `text` to the clipboard and says so for two seconds. */
export function CopyButton({ text, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timeout.current), []);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setCopied(false), CONFIRM_MS);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={label}
      data-slot="copy-button"
      onClick={copy}
      className={className}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span aria-live="polite" className="max-sm:sr-only">
        {copied ? "Copied" : "Copy"}
      </span>
    </Button>
  );
}
