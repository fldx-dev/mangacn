"use client";

import { cn } from "cn";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { type CSSProperties, useRef } from "react";
import { HalftoneBackground } from "@/registry/ui/halftone-background/halftone-background";
import { PageNumber } from "@/registry/ui/page-number/page-number";
import { SfxText } from "@/registry/ui/sfx-text/sfx-text";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";
import { CODE_WRAPS } from "./fit";
import { HeroProduct } from "./hero-product";
import { StockCard } from "./stock-card";

/** The four stages of a manga page, in the order a mangaka works. */
const STAGES = [
  {
    ja: "下書き",
    en: "Pencils",
    text: "Your stock shadcn card, as it is today. Every import and prop stays.",
  },
  {
    ja: "ペン入れ",
    en: "Inks",
    text: "Install over it. Outlines are redrawn by hand, a little different on every load.",
  },
  {
    ja: "トーン",
    en: "Tone",
    text: "Screentone dots and hatching take the place of grey fills and shadows.",
  },
  {
    ja: "写植",
    en: "Lettering",
    text: "Then the parts stock never had: bubbles, sound effects, marks.",
  },
] as const;

const COMMAND = [
  "pnpm dlx shadcn@latest add @mangacn/card @mangacn/button @mangacn/badge",
  "",
  "// components/ui/card.tsx now draws itself.",
  "// Your imports and props did not change.",
];

/**
 * Section 4, the signature (DESIGN.md): one status card goes through the four stages of a
 * manga page as the reader scrolls. Scroll sets one number, `--p` from 0 to 4, and every layer
 * reads it in CSS: the ink wipes over the blue pencils behind a pen nib, tone is cut in on a
 * diagonal, then the lettering lands. Under reduced motion the stage is not pinned and shows
 * the finished page.
 */
export function Stages() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // A short hold at each end: pencils before the first stroke, the lettered page after.
  const p = useTransform(scrollYProgress, [0.06, 0.9], [0, 4], { clamp: true });
  const style = { "--p": reduced ? 4 : p } as unknown as CSSProperties;

  return (
    <section
      data-landing="stages"
      aria-labelledby="landing-swap"
      className="relative border-b bg-paper"
    >
      <div ref={ref} className={cn("relative", !reduced && "h-[360svh]")}>
        <motion.div
          style={style}
          className={cn(
            "landing-stage top-(--fd-nav-height,3.5rem) flex w-full items-center overflow-hidden",
            !reduced && "sticky h-[calc(100svh-var(--fd-nav-height,3.5rem))]",
          )}
        >
          <div className="mx-auto grid w-full max-w-6xl grid-cols-12 items-center gap-x-6 gap-y-6 px-4 py-6 sm:px-6 lg:py-8">
            <div className="col-span-12 flex min-w-0 flex-col gap-5 lg:col-span-5">
              <PageNumber page={4} side="left" chapter="The swap" />
              <h2
                id="landing-swap"
                className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-[0.95] tracking-[-0.02em] text-balance"
              >
                Pencils in. Ink out.
              </h2>
              <ol className="flex flex-col gap-1 sm:gap-3">
                {STAGES.map((stage, index) => (
                  <li
                    key={stage.en}
                    className="landing-stage-item grid grid-cols-[2.5rem_1fr] gap-x-3"
                    style={{ "--i": index } as CSSProperties}
                  >
                    <span className="font-mono text-xs leading-7 tabular-nums">0{index + 1}</span>
                    <span className="flex flex-col">
                      <span className="flex items-baseline gap-2">
                        <span lang="ja" className="font-display text-lg sm:text-xl">
                          {stage.ja}
                        </span>
                        <span className="text-sm font-semibold">{stage.en}</span>
                      </span>
                      <span data-rule="" className="mt-1 block h-0.5 w-full" />
                      <span
                        data-desc=""
                        className="mt-1.5 hidden max-w-sm text-sm text-pretty sm:block"
                      >
                        {stage.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="col-span-12 lg:col-span-6 lg:col-start-7">
              <div className="relative mx-auto w-full max-w-[min(27rem,100%)] pt-6 pb-10 sm:pt-10 sm:pb-14 lg:scale-[1.18] xl:scale-[1.25]">
                {/* Tone: cut in on a diagonal behind the card, offset like a printed shadow. */}
                <div
                  aria-hidden="true"
                  className="landing-stage-tone absolute inset-x-2 top-10 bottom-4 translate-x-4 sm:top-14 sm:bottom-8 sm:translate-x-6"
                >
                  <HalftoneBackground tone="mid" size="md" className="absolute inset-0" />
                </div>

                <div className="relative grid">
                  {/* The pencils: the stock card, every ink token turned blue. Not real UI. */}
                  <div
                    aria-hidden="true"
                    inert
                    className="landing-pencil landing-stage-erase col-start-1 row-start-1"
                  >
                    <StockCard />
                  </div>
                  <div className="landing-stage-ink relative col-start-1 row-start-1 bg-paper">
                    <HeroProduct tableLabel="Chapter 12 pages, inked with mangacn" />
                  </div>
                  {/* The nib rides the edge of the ink while it is being laid down. */}
                  <div
                    aria-hidden="true"
                    className="landing-stage-nib pointer-events-none absolute inset-x-0 -top-7 bottom-0"
                  >
                    <span data-bob="" className="-ml-3 block w-6">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 48"
                        className="h-12 w-6 text-ink"
                        fill="currentColor"
                      >
                        <path d="M12 47 4 22V4h16v18z" />
                        <path d="M12 47V24" stroke="var(--paper)" strokeWidth="1.5" />
                        <circle cx="12" cy="22" r="2.2" fill="var(--paper)" />
                      </svg>
                    </span>
                    <span className="absolute top-12 bottom-0 left-0 -ml-px w-0.5 bg-ink" />
                  </div>
                </div>

                {/* Lettering: a line from the editor and the sound of the pen. */}
                <div className="landing-stage-letter absolute -top-2 -right-1 origin-bottom-left sm:-top-4 sm:-right-10">
                  <SpeechBubble className="max-w-44 text-sm">Inks by Friday, okay?</SpeechBubble>
                </div>
                <div
                  aria-hidden="true"
                  className="landing-stage-letter absolute -bottom-1 -left-2 origin-top-right sm:-left-12"
                >
                  <SfxText lang="ja" size="lg" color="spot" rotate={-8}>
                    カリカリ
                  </SfxText>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-12 gap-x-6 gap-y-5 px-4 pb-16 sm:px-6 md:pb-24">
        <p className="col-span-12 max-w-prose text-lg text-pretty lg:col-span-5">
          Every restyled primitive keeps shadcn's exports, slots and variant names. Install it over
          the stock file and the page you already built comes out inked.
        </p>
        <div className={cn("col-span-12 min-w-0 lg:col-span-6 lg:col-start-7", CODE_WRAPS)}>
          <CodeBlock
            className="my-0"
            viewportProps={{ "aria-label": "Swap an import: one command" }}
          >
            <Pre>
              <code>
                {COMMAND.map((codeLine, index) => (
                  <span key={codeLine || index} className="line">
                    {codeLine}
                    {index < COMMAND.length - 1 ? "\n" : null}
                  </span>
                ))}
              </code>
            </Pre>
          </CodeBlock>
        </div>
      </div>
    </section>
  );
}
