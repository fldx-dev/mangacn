"use client";

import { CheckIcon, CopyIcon, XIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

// mangacn copy button: mangacn's button that writes a value to the clipboard and confirms. The
// state (idle / copied / failed) is its name, a `data-state` and one polite announcement.

type CopyState = "idle" | "copied" | "failed";

/** Built-in words, each overridable through `labels`. */
const defaultLabels = { copy: "Copy", copied: "Copied", failed: "Copy failed" };

const icons = { idle: CopyIcon, copied: CheckIcon, failed: XIcon };

export interface CopyButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "value" | "onCopy"> {
  /** The text to copy, or a function that returns it (sync or async) at click time. */
  value: string | (() => string | Promise<string>);
  /**
   * How long the button stays copied (or failed) before it returns to idle, in milliseconds.
   * @default 2000
   */
  timeout?: number;
  /** Called with the copied text once the clipboard has it. */
  onCopy?: (value: string) => void;
  /** Called when the copy fails, including when the Clipboard API is missing (insecure context). */
  onCopyError?: (error: unknown) => void;
  /**
   * The button's name and announcement per state.
   * @default { copy: "Copy", copied: "Copied", failed: "Copy failed" }
   */
  labels?: Partial<typeof defaultLabels>;
  /**
   * The button's look, as mangacn's `button`.
   * @default "ghost"
   */
  variant?: React.ComponentProps<typeof Button>["variant"];
  /**
   * The button's size, as mangacn's `button`. With `children`, pass a text size (`sm`).
   * @default "icon"
   */
  size?: React.ComponentProps<typeof Button>["size"];
  /** A visible label beside the icon; without it the button is icon-only, named by `labels`. */
  children?: React.ReactNode;
}

export function CopyButton({
  value,
  timeout = 2000,
  onCopy,
  onCopyError,
  labels,
  variant = "ghost",
  size = "icon",
  className,
  children,
  onClick,
  ...props
}: CopyButtonProps) {
  const words = { ...defaultLabels, ...labels };
  const [state, setState] = React.useState<CopyState>("idle");
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const settle = (next: CopyState) => {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), timeout);
  };

  const copy = async () => {
    try {
      const text = typeof value === "function" ? await value() : value;
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error("The Clipboard API is not available here.");
      }
      await navigator.clipboard.writeText(text);
      settle("copied");
      onCopy?.(text);
    } catch (error) {
      settle("failed");
      onCopyError?.(error);
    }
  };

  const Icon = icons[state];
  const name = state === "copied" ? words.copied : state === "failed" ? words.failed : words.copy;

  return (
    <>
      <Button
        type="button"
        data-slot="copy-button"
        data-state={state}
        variant={variant}
        size={size}
        aria-label={children ? undefined : name}
        className={className}
        onClick={(event) => {
          onClick?.(event);
          void copy();
        }}
        {...props}
      >
        <Icon aria-hidden="true" data-icon={children ? "inline-start" : undefined} />
        {children}
      </Button>
      {/* One polite announcement per copy; empty while idle, so nothing repeats. */}
      <span role="status" className="sr-only">
        {state === "idle" ? "" : name}
      </span>
    </>
  );
}
