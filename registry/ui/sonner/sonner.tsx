"use client";

import { Loader2Icon, XIcon } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { createPortal } from "react-dom";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Sonner (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-05.
// Restyled for mangacn: every toast is an alert-like paper card whose heavy outline InkFrame
// draws (sonner renders the toast element itself, so the Toaster portals one frame into each
// toast it mounts); no shadow, no CSS border; the success, info, warning and error icons are
// ink glyphs; with `richColors` only errors change colour (spot outline, title and icon).

type Glyph = "success" | "info" | "warning" | "error";

// Glyphs on a 24 × 24 grid, one pen stroke each in `currentColor`, slightly off true like the
// hand-drawn outlines around them. The success loop stays open where the pen lifts.
const GLYPHS: Record<Glyph, React.ReactNode> = {
  success: (
    <>
      <path d="M20 8.2A8.6 8.6 0 1 0 20.6 12.4" />
      <path d="M7.6 12.2c1.2.9 2.2 2 3 3.3 1.9-3.6 4.6-6.6 8.2-9.4" />
    </>
  ),
  info: (
    <>
      <path d="M12 3.3c4.9-.1 8.8 3.8 8.7 8.8-.1 4.9-4 8.7-8.9 8.6-4.8-.1-8.5-4-8.4-8.8.1-4.7 3.9-8.5 8.6-8.6Z" />
      <path d="M12.1 11c-.2 2-.1 3.8.1 5.7" />
      <path d="M12 7.7h.01" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.4c-3.1 5.3-6.1 10.6-9 16.1 6 .3 12 .2 18-.1C18.1 14 15.1 8.6 12 3.4Z" />
      <path d="M12 9.3c-.1 1.9 0 3.7.2 5.4" />
      <path d="M12.1 17.4h.01" />
    </>
  ),
  error: (
    <>
      <path d="M8.3 3.2h7.3l5.2 5.1-.1 7.4-5.1 5.1H8.2l-5-5.2.1-7.3Z" />
      <path d="M9 9.1c2 1.8 4 3.8 6 5.9M15.1 8.9c-2.1 2-4 4.1-6 6.2" />
    </>
  ),
};

function InkGlyph({ glyph, className }: { glyph: Glyph; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-glyph={glyph}
      className={className}
    >
      {GLYPHS[glyph]}
    </svg>
  );
}

/** The styled toasts sonner has mounted under `section`, in DOM order. */
function useToastElements(section: HTMLElement | null) {
  const [toasts, setToasts] = React.useState<HTMLElement[]>([]);
  React.useEffect(() => {
    if (!section) return;
    const update = () => {
      const next = [
        ...section.querySelectorAll<HTMLElement>('[data-sonner-toast][data-styled="true"]'),
      ];
      setToasts((previous) =>
        previous.length === next.length && previous.every((toast, i) => toast === next[i])
          ? previous
          : next,
      );
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(section, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [section]);
  return toasts;
}

const toastKeys = new WeakMap<HTMLElement, string>();
let nextToastKey = 0;
function keyFor(toast: HTMLElement) {
  let key = toastKeys.get(toast);
  if (!key) {
    key = `toast-${nextToastKey++}`;
    toastKeys.set(toast, key);
  }
  return key;
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const [section, setSection] = React.useState<HTMLElement | null>(null);
  const toasts = useToastElements(section);

  return (
    <>
      <Sonner
        ref={setSection}
        theme={theme as ToasterProps["theme"]}
        className="toaster group [font-family:inherit]!"
        icons={{
          success: <InkGlyph glyph="success" className="size-4" />,
          info: <InkGlyph glyph="info" className="size-4" />,
          warning: <InkGlyph glyph="warning" className="size-4" />,
          error: <InkGlyph glyph="error" className="size-4" />,
          loading: <Loader2Icon className="size-4 motion-safe:animate-spin" />,
          close: (
            <>
              <InkFrame
                as="span"
                shape="ellipse"
                fill="paper"
                className="pointer-events-none absolute inset-0 -z-1"
              />
              <XIcon className="size-3" />
            </>
          ),
        }}
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "transparent",
            "--border-radius": "var(--radius)",
            // `richColors` keeps paper and ink for every kind but errors, which ink in spot.
            "--success-bg": "var(--popover)",
            "--success-text": "var(--popover-foreground)",
            "--success-border": "transparent",
            "--info-bg": "var(--popover)",
            "--info-text": "var(--popover-foreground)",
            "--info-border": "transparent",
            "--warning-bg": "var(--popover)",
            "--warning-text": "var(--popover-foreground)",
            "--warning-border": "transparent",
            "--error-bg": "var(--popover)",
            "--error-text": "var(--destructive)",
            "--error-border": "transparent",
          } as React.CSSProperties
        }
        toastOptions={{
          classNames: {
            // sonner's own stylesheet is unlayered, so the overrides it sets itself need `!`.
            toast:
              "cn-toast group/toast text-sm! shadow-none! focus-visible:shadow-none! focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-ring! has-[>[data-inked=true]]:bg-transparent!",
            description:
              "text-muted-foreground! group-data-[rich-colors=true]/toast:group-data-[type=error]/toast:text-foreground!",
            actionButton: "rounded-sm! font-medium!",
            cancelButton: "rounded-sm! bg-muted! text-foreground!",
            closeButton:
              "border-0! has-[>[data-inked=true]]:bg-transparent! hover:[--paper:var(--tone-1)]",
          },
        }}
        {...props}
      />
      {toasts.map((toast) =>
        createPortal(
          <InkFrame
            as="span"
            fill="paper"
            className="pointer-events-none absolute inset-0 -z-1 rounded-(--border-radius) opacity-100! [--outline-width:var(--outline-width-heavy)] group-data-[rich-colors=true]/toast:group-data-[type=error]/toast:[--ink:var(--destructive)]"
          />,
          toast,
          keyFor(toast),
        ),
      )}
    </>
  );
};

export { Toaster };
