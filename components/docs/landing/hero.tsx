import { cn } from "cn";
import type { CSSProperties, ReactNode } from "react";
import { Badge } from "@/registry/ui/badge/badge";
import { FocusLines } from "@/registry/ui/focus-lines/focus-lines";
import { PageNumber } from "@/registry/ui/page-number/page-number";
import { Panel } from "@/registry/ui/panel/panel";
import { SfxText } from "@/registry/ui/sfx-text/sfx-text";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";
import { VerticalText } from "@/registry/ui/vertical-text/vertical-text";
import { InstallCommand } from "../install-command";
import { ButtonLink } from "./button-link";
import { CODE_WRAPS } from "./fit";
import { HeroBadges } from "./hero-badges";
import { HeroForm } from "./hero-form";
import { HeroPage } from "./hero-page";
import { HeroProduct } from "./hero-product";

/** The fan of panels under the title page: four live compositions, each tilted its own way. */
const FAN: { caption: string; tilt: string; content: ReactNode }[] = [
  { caption: "In a product", tilt: "-rotate-3 lg:translate-y-2", content: <HeroProduct /> },
  { caption: "A form", tilt: "rotate-2 lg:-translate-y-3", content: <HeroForm /> },
  { caption: "On the page", tilt: "-rotate-2 lg:translate-y-4", content: <HeroPage /> },
  { caption: "Labels", tilt: "rotate-3 lg:-translate-y-1", content: <HeroBadges /> },
];

const HEADLINE = "font-display text-[clamp(3.25rem,9.6vw,8rem)] leading-[0.9] tracking-[-0.02em]";

/** One line of the headline; `--i` staggers its ink. */
const line = (index: number) => ({ "--i": index }) as CSSProperties;

/**
 * Section 2, the hero, set as a chapter's title page (DESIGN.md). The headline is drawn twice:
 * an underdrawing in non-photo blue that paints with the page, and the ink over it, laid down
 * line by line like a pen going over pencils. Focus lines turn slowly behind it; a vertical
 * column on the right says what the library is, in the language the form comes from.
 */
export function Hero() {
  return (
    <section
      data-landing="hero"
      aria-labelledby="landing-hero"
      className="relative isolate overflow-hidden border-b"
    >
      <div className="relative isolate">
        {/* Oversized and centred on the headline, so turning never shows a corner. Placed at a fixed
            offset, not a share of the hero's height: that height changes as fonts load, and
            moving a layer this size would be one huge layout shift. */}
        <div
          aria-hidden="true"
          className="landing-turn -z-10 pointer-events-none absolute top-[clamp(14rem,40vw,24rem)] left-[34%] isolate size-[150vmax] -translate-x-1/2 -translate-y-1/2"
        >
          <FocusLines center={[50, 50]} count={96} length="long" className="opacity-[0.13]" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl grid-cols-12 gap-x-6 px-4 pt-6 sm:px-6 lg:pt-8">
          <div className="col-span-12 flex items-center justify-between gap-4">
            <PageNumber
              page={1}
              side="left"
              chapter={<span lang="ja">第1話</span>}
              className="text-ink"
            />
            <Badge variant="spot" className="-rotate-2">
              Open source · MIT
            </Badge>
          </div>

          <div className="relative col-span-12 mt-6 sm:col-span-11 lg:col-span-10 lg:mt-4">
            {/* The pencils: the same three lines in blue, under the ink and off it a little. */}
            <p
              aria-hidden="true"
              className={cn(HEADLINE, "landing-pencil-under absolute inset-0 select-none")}
              style={{ color: "var(--pencil)" }}
            >
              <span className="block">Your UI,</span>
              <span className="block py-[0.06em] pl-[0.1em] text-[0.86em]">DRAWN</span>
              <span className="block">by hand.</span>
            </p>
            <h1 id="landing-hero" className={cn(HEADLINE, "relative")}>
              <span className="landing-ink-line block" style={line(0)}>
                Your UI,
              </span>{" "}
              <span className="landing-ink-line block" style={line(1)}>
                <SfxText
                  size="xl"
                  rotate={-3}
                  className="text-[0.92em] leading-[1] sm:text-[0.92em]"
                >
                  drawn
                </SfxText>
              </span>{" "}
              <span className="landing-ink-line block" style={line(2)}>
                by hand.
              </span>
            </h1>
          </div>

          {/* "Manga parts, drawn by hand": the headline again, in the form's own script. */}
          <div
            lang="ja"
            className="col-span-1 hidden justify-end pt-6 sm:flex lg:col-span-2 lg:justify-center"
          >
            <VerticalText className="font-display text-lg leading-snug tracking-[0.3em] text-ink lg:text-2xl">
              手で描いた、マンガの部品。
            </VerticalText>
          </div>

          <div className="col-span-12 mt-8 flex flex-col gap-6 lg:col-span-5">
            <SpeechBubble className="max-w-md self-start text-base sm:text-lg">
              Dashboards, landing pages, manga readers. shadcn's API, a mangaka's pen.
            </SpeechBubble>
          </div>

          <div className="col-span-12 mt-6 flex min-w-0 flex-col gap-5 lg:col-span-6 lg:col-start-7 lg:mt-8">
            <div className={cn("w-full min-w-0 text-left", CODE_WRAPS)}>
              <InstallCommand setup />
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/docs/components" size="lg">
                Browse components
              </ButtonLink>
              <ButtonLink href="/docs" variant="outline" size="lg">
                Read the docs
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-16 grid w-full max-w-6xl gap-8 px-6 pb-20 sm:grid-cols-2 lg:flex lg:items-start lg:justify-center lg:gap-0 lg:px-4">
        {FAN.map((cell) => (
          <Panel
            key={cell.caption}
            caption={cell.caption}
            className={cn(
              "min-w-0 bg-paper px-5 pb-5 transition-[rotate,scale,translate] duration-300 ease-(--landing-ease) hover:z-10 hover:rotate-0 hover:scale-[1.02] motion-reduce:transition-none lg:w-[calc(25%+1.25rem)] lg:-mx-2.5",
              cell.tilt,
            )}
          >
            {cell.content}
          </Panel>
        ))}
      </div>
    </section>
  );
}
