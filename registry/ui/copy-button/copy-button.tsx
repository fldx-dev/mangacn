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

/** How long a repeated announcement waits after the live region is cleared. */
const REANNOUNCE_MS = 100;

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
  const [announcement, setAnnouncement] = React.useState("");
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const announceTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mounted = React.useRef(true);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      clearTimeout(announceTimer.current);
    };
  }, []);

  // Copying twice in a row would not change the live region, so it would be read once: clear the
  // region, then set the text again a moment later. A new text is set at once.
  const announce = (text: string) => {
    clearTimeout(announceTimer.current);
    if (text !== announcement) {
      setAnnouncement(text);
      return;
    }
    setAnnouncement("");
    announceTimer.current = setTimeout(() => setAnnouncement(text), REANNOUNCE_MS);
  };

  const settle = (next: CopyState) => {
    // The clipboard may answer after unmount: start no timer then.
    if (!mounted.current) return;
    setState(next);
    announce(next === "copied" ? words.copied : words.failed);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setState("idle");
      clearTimeout(announceTimer.current);
      setAnnouncement("");
    }, timeout);
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
      {/* One polite announcement per copy; empty while idle. */}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
