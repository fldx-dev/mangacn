"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PackageManager } from "@/lib/docs/package-managers";

const CONFIRM_MS = 2000;

/** The storage key of the install tabs' package manager (Fumadocs keys a tab group by its id). */
const MANAGER_KEY = "package-manager";

/** The manager the reader last picked in an install tab, where the browser allows storage. */
function pickedManager(commands: Record<PackageManager, string>): PackageManager {
  try {
    const picked =
      window.sessionStorage.getItem(MANAGER_KEY) ?? window.localStorage.getItem(MANAGER_KEY);
    if (picked && picked in commands) return picked as PackageManager;
  } catch {
    // Storage blocked: fall back to the first manager.
  }
  return "pnpm";
}

export interface CopyInstallChipProps {
  /** `c-stamp-3`; the chip reads `@mangacn/c-stamp-3`. */
  name: string;
  commands: Record<PackageManager, string>;
}

/**
 * A variant's install name as a chip: a click copies its `shadcn add` line for the package
 * manager picked in the page's install tabs (pnpm when none was), and says so for two seconds.
 */
export function CopyInstallChip({ name, commands }: CopyInstallChipProps) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timeout.current), []);

  const copy = async () => {
    await navigator.clipboard.writeText(commands[pickedManager(commands)]);
    setCopied(true);
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setCopied(false), CONFIRM_MS);
  };

  return (
    <button
      type="button"
      data-slot="copy-install-chip"
      onClick={copy}
      title={commands.pnpm}
      // Holds the visible text whole (WCAG 2.5.3, axe label-content-name-mismatch).
      aria-label={`Copy the install command for @mangacn/${name}`}
      className="inline-flex h-7 max-w-full min-w-0 shrink-0 items-center gap-1.5 rounded-sm border bg-fd-card px-2 font-mono text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <span className="truncate">@mangacn/{name}</span>
      {copied ? (
        <Check aria-hidden className="size-3.5 shrink-0" />
      ) : (
        <Copy aria-hidden className="size-3.5 shrink-0" />
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
