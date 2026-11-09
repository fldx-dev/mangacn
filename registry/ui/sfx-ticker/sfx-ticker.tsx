"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import * as React from "react";
import { SfxText, type SfxTextProps } from "@/components/sfx-text";

// The track holds two identical groups and slides by one group (`mangacn-marquee`, shipped in
// this item's `css`), so the loop has no seam. Each group is at least as wide as the viewport,
// so a short word list still fills the band. `motion-safe:` keeps it still under reduced motion
// before hydration too; after it, the class is dropped while the user asks for reduced motion.
const trackVariants = cva("flex w-max hover:[animation-play-state:paused]", {
  variants: {
    speed: {
      slow: "[--sfx-ticker-duration:60s]",
      normal: "[--sfx-ticker-duration:40s]",
      fast: "[--sfx-ticker-duration:20s]",
    },
  },
  defaultVariants: { speed: "normal" },
});

/** The animation per direction; `reverse` sits in the shorthand so no longhand can lose to it. */
const ANIMATIONS = {
  left: "motion-safe:animate-[mangacn-marquee_var(--sfx-ticker-duration)_linear_infinite]",
  right: "motion-safe:animate-[mangacn-marquee_var(--sfx-ticker-duration)_linear_infinite_reverse]",
} as const;

type SfxColor = NonNullable<SfxTextProps["color"]>;

/** One sound effect on the band: its text, and optionally its own colour and language. */
export interface SfxTickerWord {
  /** The word as it is read. */
  text: string;
  /** Overrides the band's `color` for this word: a spot-red `BAM!` among ink ones. */
  color?: SfxColor;
  /** The word's language, for example `"ja"` for katakana. */
  lang?: string;
}

export interface SfxTickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  /**
   * The sound effects, in order: plain strings, or `{ text, color, lang }` for a word with its
   * own colour or language. Rendered twice for a seamless loop.
   */
  words: (string | SfxTickerWord)[];
  /**
   * How long one pass of the words takes: 60, 40 or 20 seconds.
   * @default "normal"
   */
  speed?: VariantProps<typeof trackVariants>["speed"];
  /**
   * Which way the words travel.
   * @default "left"
   */
  direction?: keyof typeof ANIMATIONS;
  /**
   * The words' colour, as `sfx-text`'s: ink with a paper stroke, paper with an ink stroke, or
   * spot red.
   * @default "ink"
   */
  color?: SfxColor;
  /**
   * The words' size, as `sfx-text`'s: `sm` for a quiet strip, `lg` for a loud one. Each
   * group stays at least as wide as the viewport at every size.
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Names the band for assistive tech, followed by the words once, in a visually hidden
   * paragraph. Without it the band is decoration and wholly hidden.
   */
  label?: string;
}

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener?.("change", onChange);
  return () => query.removeEventListener?.("change", onChange);
}

/** True while the user asks for reduced motion; false on the server (CSS still holds it). */
function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    subscribe,
    () => typeof window !== "undefined" && !!window.matchMedia?.(REDUCE_QUERY).matches,
    () => false,
  );
}

function Group({
  words,
  color,
  size,
}: {
  words: SfxTickerWord[];
  color: SfxColor;
  size: NonNullable<SfxTickerProps["size"]>;
}) {
  return (
    <div
      data-slot="sfx-ticker-group"
      className="flex min-w-screen shrink-0 items-center justify-around"
    >
      {words.map((word, index) => (
        <SfxText
          // Words may repeat; their place in the list is their identity.
          // biome-ignore lint/suspicious/noArrayIndexKey: a static list, never reordered
          key={index}
          lang={word.lang}
          size={size}
          color={word.color ?? color}
          rotate={index % 2 ? 5 : -5}
          className="mx-6 sm:mx-10"
        >
          {word.text}
        </SfxText>
      ))}
    </div>
  );
}

/**
 * A band of sound effects scrolling past, like the strip between two manga pages. Decorative:
 * the moving words are hidden from assistive tech, and `label` gives them a still, readable
 * copy. Paused on hover, and still under reduced motion.
 */
export function SfxTicker({
  className,
  words,
  speed,
  direction = "left",
  color = "ink",
  size = "md",
  label,
  ...props
}: SfxTickerProps) {
  const reduce = usePrefersReducedMotion();
  const items = words.map((word) => (typeof word === "string" ? { text: word } : word));
  return (
    <div
      data-slot="sfx-ticker"
      data-speed={speed ?? "normal"}
      data-direction={direction}
      data-size={size}
      data-animated={!reduce}
      aria-hidden={label ? undefined : true}
      className={cn("relative overflow-hidden py-5", className)}
      {...props}
    >
      {label && (
        <p data-slot="sfx-ticker-label" className="sr-only">
          {label}:{" "}
          {items.map((word, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a static list, never reordered
            <React.Fragment key={index}>
              {index > 0 && ", "}
              <span lang={word.lang}>{word.text}</span>
            </React.Fragment>
          ))}
        </p>
      )}
      <div
        data-slot="sfx-ticker-track"
        aria-hidden="true"
        className={cn(trackVariants({ speed }), !reduce && ANIMATIONS[direction])}
      >
        <Group words={items} color={color} size={size} />
        <Group words={items} color={color} size={size} />
      </div>
    </div>
  );
}
