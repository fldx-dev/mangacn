"use client";

import { cn } from "cn";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Emanata } from "@/registry/ui/emanata/emanata";
import { FocusLines } from "@/registry/ui/focus-lines/focus-lines";
import { HalftoneBackground } from "@/registry/ui/halftone-background/halftone-background";
import { PageNumber } from "@/registry/ui/page-number/page-number";
import { Panel } from "@/registry/ui/panel/panel";
import { PanelGrid, PanelGridItem } from "@/registry/ui/panel-grid/panel-grid";
import { SfxText } from "@/registry/ui/sfx-text/sfx-text";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";
import { SpeedLines } from "@/registry/ui/speed-lines/speed-lines";
import { ThoughtBubble } from "@/registry/ui/thought-bubble/thought-bubble";

/** The items on the spread, in the order the legend lists them. */
const ITEMS = [
  "panel-grid",
  "panel",
  "focus-lines",
  "speed-lines",
  "sfx-text",
  "speech-bubble",
  "thought-bubble",
  "halftone-background",
  "emanata",
  "page-number",
] as const;
type Item = (typeof ITEMS)[number];

/** Marks one use of an item on the spread, so the legend can point at it. */
function Part({
  name,
  className,
  children,
}: {
  name: Item;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span data-part={name} className={cn("landing-part", className)}>
      {children}
    </span>
  );
}

/** A background layer kept inside the panel's outline, so lines and dots never cross the ink. */
function Inside({ name, children }: { name: Item; children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      data-part={name}
      className="landing-part pointer-events-none absolute inset-1 -z-1 isolate overflow-hidden"
    >
      {children}
    </div>
  );
}

/** One page of the spread: two columns on a phone, three from `sm`. */
function Page({
  children,
  folio,
  side,
}: {
  children: ReactNode;
  folio: number;
  side: "left" | "right";
}) {
  return (
    <div className="relative flex min-w-0 flex-col bg-paper p-2 pb-9 sm:p-3 sm:pb-10">
      <div data-part="panel-grid" className="landing-part block">
        <PanelGrid
          columns={{ base: 2, sm: 3 }}
          gutter="sm"
          className="auto-rows-[minmax(8.5rem,auto)] sm:auto-rows-[minmax(10rem,auto)]"
        >
          {children}
        </PanelGrid>
      </div>
      {/* The folio sits in the page's outer corner, as printed. */}
      <Part
        name="page-number"
        className={cn("absolute bottom-2.5", side === "right" ? "right-4" : "left-4")}
      >
        <PageNumber page={folio} side={side} />
      </Part>
    </div>
  );
}

function Cell({ wide, children }: { wide?: boolean; children: ReactNode }) {
  return (
    <PanelGridItem colSpan={wide ? 2 : 1} className={cn(wide && "col-span-2")}>
      <div data-part="panel" className="landing-part flex h-full">
        {children}
      </div>
    </PanelGridItem>
  );
}

/** Page 7, the right-hand page: read first. */
const PAGE_SEVEN = (
  <>
    <Cell wide>
      <Panel as="div" className="w-full items-center justify-center">
        <Inside name="focus-lines">
          <FocusLines count={72} />
        </Inside>
        <Part name="sfx-text">
          <SfxText lang="ja" size="lg" rotate={-8}>
            ドドド
          </SfxText>
        </Part>
      </Panel>
    </Cell>
    <Cell>
      <Panel as="div" className="w-full items-center justify-start">
        <Inside name="halftone-background">
          <HalftoneBackground tone="light" fade="bottom" />
        </Inside>
        <Part name="speech-bubble" className="mt-2">
          <SpeechBubble lang="ja" aria-label="Kenji">
            遅いぞ。
          </SpeechBubble>
        </Part>
      </Panel>
    </Cell>
    <Cell>
      <Panel as="div" className="w-full items-center justify-center">
        <div className="relative">
          <Part name="thought-bubble">
            <ThoughtBubble lang="ja" className="text-sm">
              ここで合ってる…？
            </ThoughtBubble>
          </Part>
          <Part name="emanata" className="absolute -top-2 -right-2">
            <Emanata kind="sweat" size="sm" decorative />
          </Part>
        </div>
      </Panel>
    </Cell>
    <Cell wide>
      <Panel as="div" tone="lines" className="w-full justify-end">
        <Part name="speech-bubble" className="self-start">
          <SpeechBubble lang="ja" aria-label="Aiko">
            じゃあ、始めようか。
          </SpeechBubble>
        </Part>
      </Panel>
    </Cell>
  </>
);

/** Page 8, the left-hand page: read second. */
const PAGE_EIGHT = (
  <>
    <Cell wide>
      <Panel as="div" className="w-full items-center justify-center">
        <Inside name="speed-lines">
          <SpeedLines direction="left" density="dense" />
        </Inside>
        <Part name="sfx-text">
          <SfxText lang="ja" size="lg" rotate={-4}>
            シュッ
          </SfxText>
        </Part>
      </Panel>
    </Cell>
    <Cell>
      <Panel as="div" className="w-full items-center justify-center">
        <Part name="speech-bubble">
          <SpeechBubble lang="ja" shape="shout" tail="none" aria-label="Kenji">
            待って！
          </SpeechBubble>
        </Part>
      </Panel>
    </Cell>
    <Cell>
      <Panel as="div" tone="halftone" className="w-full items-center justify-center">
        <Part name="thought-bubble">
          <ThoughtBubble lang="ja" tailSide="right" className="text-sm">
            …まあ、いいか。
          </ThoughtBubble>
        </Part>
      </Panel>
    </Cell>
    <Cell wide>
      <Panel as="div" tone="lines" className="w-full justify-end">
        <Part name="speech-bubble" className="self-start">
          <SpeechBubble lang="ja" aria-label="Aiko">
            続きは、次のページで。
          </SpeechBubble>
        </Part>
      </Panel>
    </Cell>
  </>
);

/** How long the legend rests on each item while nobody is pointing at it. */
const IDLE_MS = 2400;

/**
 * Section 7: a two-page spread (見開き), set on an ink ground like a book open on the desk.
 * Manga is read right to left, so page 7 is the right-hand page. The legend under it names
 * every item on the spread; pointing at a name (or focusing it) rings every use of that item
 * on both pages with a pencil callout. While nobody points, the legend walks through the
 * items on its own; under reduced motion, or off screen, it stays put.
 */
export function WholePage() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState<Item | null>("speech-bubble");
  const [pinned, setPinned] = useState(false);

  // The idle walk: a plain interval, stopped while the section is off screen, while the reader
  // has picked an item, and under reduced motion.
  useEffect(() => {
    if (pinned) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      window.clearInterval(timer);
      if (!entry?.isIntersecting) return;
      timer = window.setInterval(() => {
        setActive((current) => ITEMS[(ITEMS.indexOf(current ?? ITEMS[0]) + 1) % ITEMS.length]);
      }, IDLE_MS);
    });
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [pinned]);

  const pick = (item: Item) => {
    setActive(item);
    setPinned(true);
  };

  return (
    <section
      ref={ref}
      data-landing="whole-page"
      aria-labelledby="landing-page"
      className="relative isolate overflow-hidden bg-ink text-paper"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 md:py-28">
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-5">
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-7">
            <p className="flex items-baseline gap-3 font-display text-sm text-paper">
              <span lang="ja">見開き</span>
              <span>Pages 7 and 8</span>
            </p>
            <h2
              id="landing-page"
              className="font-display text-[clamp(2.25rem,6vw,5rem)] leading-[0.92] tracking-[-0.02em] text-balance"
            >
              A whole page, in components
            </h2>
          </div>
          <p className="col-span-12 max-w-sm text-pretty text-paper/80 lg:col-span-4 lg:col-start-9">
            Two facing pages, read right to left: page 7 first. Pick a part below to find every
            place it is used.
          </p>
        </div>

        <div
          data-active={active ?? undefined}
          className="landing-spread relative grid gap-3 lg:grid-cols-2 lg:gap-0 lg:shadow-[0_24px_60px_-20px_rgb(0_0_0/0.6)]"
        >
          {/* Page 7 is first in the reading order and in the DOM; on the spread it is the
              right-hand page. The gutter between the two is a soft fold shadow. */}
          <div className="text-ink lg:order-2">
            <Page folio={7} side="right">
              {PAGE_SEVEN}
            </Page>
          </div>
          <div className="text-ink lg:order-1">
            <Page folio={8} side="left">
              {PAGE_EIGHT}
            </Page>
          </div>
          <div
            aria-hidden="true"
            className="landing-fold pointer-events-none absolute inset-y-0 left-1/2 hidden w-24 -translate-x-1/2 lg:block"
          />
        </div>

        <ul aria-label="Items on the spread" className="flex flex-wrap gap-2">
          {ITEMS.map((item) => {
            const on = item === active;
            return (
              <li key={item}>
                <button
                  type="button"
                  aria-pressed={on && pinned}
                  onClick={() => pick(item)}
                  onPointerEnter={() => setActive(item)}
                  onFocus={() => setActive(item)}
                  className={cn(
                    "min-h-9 border border-paper/40 px-3 py-1.5 font-mono text-xs transition-[background-color,color,translate] duration-200 ease-(--landing-ease) hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spot motion-reduce:transition-none sm:text-sm",
                    on ? "border-paper bg-paper text-ink" : "text-paper hover:border-paper",
                  )}
                >
                  {item}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
