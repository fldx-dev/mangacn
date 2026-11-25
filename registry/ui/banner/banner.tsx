"use client";

import { cn } from "cn";
import { XIcon } from "lucide-react";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Button } from "@/components/ui/button";

// mangacn banner: a dismissible announcement bar, paper with an ink rule under it or solid ink.
// A named region (a labelled <section>), not an alert. Closing collapses it (instantly under reduced motion) and hands
// focus on to the next focusable element, or `main`, so it is never lost to the body; a controlled
// `open` set to false from outside does the same.

/** Built-in words, each overridable through `labels`. */
const defaultLabels = { region: "Announcement", dismiss: "Dismiss announcement" };

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/** The collapse lasts 200 ms; this backs up a `transitionend` that never comes. */
const COLLAPSE_MS = 250;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

const bannerBase =
  "group/banner relative isolate grid w-full grid-rows-[1fr] text-sm transition-[grid-template-rows] duration-200 ease-out data-[state=closed]:grid-rows-[0fr] motion-reduce:transition-none";

const bannerVariants = {
  default: "bg-paper text-ink",
  inverted: "bg-ink text-paper",
} as const;

interface BannerContextValue {
  close: (event: React.MouseEvent<HTMLElement>) => void;
  labels: typeof defaultLabels;
}

const BannerContext = React.createContext<BannerContextValue | null>(null);

function useBanner(part: string) {
  const context = React.useContext(BannerContext);
  if (!context) throw new Error(`${part} must be used within a <Banner />`);
  return context;
}

/** Whether `element` is drawn: no `display: none` on it or above it, and not `visibility: hidden`. */
function isRendered(element: HTMLElement) {
  const view = element.ownerDocument.defaultView;
  if (!view) return true;
  if (view.getComputedStyle(element).visibility === "hidden") return false;
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (view.getComputedStyle(node).display === "none") return false;
  }
  return true;
}

/** The first rendered focusable element after `root` in document order, outside it; else `main`. */
function nextFocusTarget(root: HTMLElement): HTMLElement | null {
  const candidates = Array.from(root.ownerDocument.querySelectorAll<HTMLElement>(FOCUSABLE));
  const next = candidates.find(
    (element) =>
      !root.contains(element) &&
      // DOCUMENT_POSITION_FOLLOWING
      root.compareDocumentPosition(element) & 4 &&
      !element.closest("[hidden], [inert]") &&
      isRendered(element),
  );
  if (next) return next;
  const main = root.ownerDocument.querySelector<HTMLElement>("main");
  if (main && !main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
  return main;
}

export interface BannerProps extends React.ComponentProps<"section"> {
  /**
   * Paper with an ink rule under it, or ink with paper text. There is no spot variant: spot is
   * never a surface colour.
   * @default "default"
   */
  variant?: "default" | "inverted";
  /** Whether the banner shows (controlled). Pair with `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the banner shows at first (uncontrolled).
   * @default true
   */
  defaultOpen?: boolean;
  /**
   * Called with `false` when the close button dismisses it. Remembering a dismissal (in
   * `localStorage`, say) is the app's.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The region's name and the close button's name.
   * @default { region: "Announcement", dismiss: "Dismiss announcement" }
   */
  labels?: Partial<typeof defaultLabels>;
}

export function Banner({
  variant = "default",
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  labels,
  className,
  children,
  onTransitionEnd,
  ...props
}: BannerProps) {
  const words = { ...defaultLabels, ...labels };
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  // Closed and collapsed: unmounted. Closed but still collapsing: in the DOM, inert.
  const [gone, setGone] = React.useState(!open);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  // A controlled `open` set to false from outside, with focus inside: hand focus on as the close
  // button does, before `inert` would drop it on the body.
  React.useLayoutEffect(() => {
    const root = bodyRef.current?.closest<HTMLElement>('[data-slot="banner"]');
    if (!open && root?.contains(root.ownerDocument.activeElement)) nextFocusTarget(root)?.focus();
  }, [open]);

  // Opened again after it was gone: back in the DOM on this render. Adjusted while rendering, not
  // in an effect, so the reopened banner never waits a commit for its state.
  if (open && gone) setGone(false);

  React.useEffect(() => {
    if (open) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.(REDUCE_QUERY).matches;
    // Under reduced motion it goes at once, here, after the layout effect above has handed focus
    // on: it has to stay mounted for that one commit, so this cannot be decided while rendering.
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- unmounts only after the commit that hands focus on
      setGone(true);
      return;
    }
    const timer = setTimeout(() => setGone(true), COLLAPSE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  const close = (event: React.MouseEvent<HTMLElement>) => {
    const root = event.currentTarget.closest<HTMLElement>('[data-slot="banner"]');
    if (root?.contains(root.ownerDocument.activeElement)) nextFocusTarget(root)?.focus();
    if (openProp === undefined) setUncontrolledOpen(false);
    onOpenChange?.(false);
  };

  if (gone && !open) return null;

  return (
    <BannerContext.Provider value={{ close, labels: words }}>
      <section
        aria-label={words.region}
        data-slot="banner"
        data-variant={variant}
        data-state={open ? "open" : "closed"}
        inert={!open}
        className={cn(bannerBase, bannerVariants[variant], className)}
        onTransitionEnd={(event) => {
          onTransitionEnd?.(event);
          if (!open && event.target === event.currentTarget) setGone(true);
        }}
        {...props}
      >
        <div ref={bodyRef} className="min-h-0 overflow-hidden">
          <div className="relative flex flex-wrap items-start gap-x-3 gap-y-2 py-3 pr-12 pl-4 md:flex-nowrap md:items-center">
            {children}
          </div>
        </div>
        {variant === "default" && (
          <InkFrame
            as="span"
            shape="line"
            fill="none"
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-1 h-(--outline-width)"
          />
        )}
      </section>
    </BannerContext.Provider>
  );
}

/** An icon before the text; decorative, so it is hidden from assistive tech. */
export function BannerIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="banner-icon"
      aria-hidden="true"
      className={cn(
        "flex shrink-0 pt-0.5 md:pt-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

/** The announcement's text. It wraps at 360 and takes the rest of the line from 768 up. */
export function BannerContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="banner-content"
      className={cn("min-w-0 flex-1 text-pretty", className)}
      {...props}
    />
  );
}

/** Holds the app's action: a link or a button. It moves under the text on a narrow screen. */
export function BannerAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="banner-action"
      className={cn(
        "flex basis-full items-center gap-2 group-has-data-[slot=banner-icon]/banner:pl-7 md:basis-auto md:shrink-0 md:group-has-data-[slot=banner-icon]/banner:pl-0",
        className,
      )}
      {...props}
    />
  );
}

/** The close button, top-right, named by `labels.dismiss`. */
export function BannerClose({
  className,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children">) {
  const { close, labels } = useBanner("BannerClose");
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      data-slot="banner-close"
      aria-label={labels.dismiss}
      className={cn(
        "absolute top-2 right-2 group-data-[variant=inverted]/banner:hover:bg-paper/15 group-data-[variant=inverted]/banner:hover:text-paper md:top-1/2 md:-translate-y-1/2",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) close(event);
      }}
      {...props}
    >
      <XIcon aria-hidden="true" />
    </Button>
  );
}
