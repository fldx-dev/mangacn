import { cn } from "cn";
import type { ReactNode } from "react";
import { Badge } from "@/registry/ui/badge/badge";
import { Emanata } from "@/registry/ui/emanata/emanata";
import { FocusLines } from "@/registry/ui/focus-lines/focus-lines";
import { Panel } from "@/registry/ui/panel/panel";
import { SfxText } from "@/registry/ui/sfx-text/sfx-text";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";
import { InstallCommand } from "../install-command";
import { ButtonLink } from "../landing/button-link";
import { CODE_WRAPS } from "../landing/fit";
import { HeroBadges } from "../landing/hero-badges";
import { HeroForm } from "../landing/hero-form";
import { HeroPage } from "../landing/hero-page";
import { HeroProduct } from "../landing/hero-product";

/** The fan of panels under the headline: four live compositions, each tilted its own way. */
const FAN: { caption: string; tilt: string; content: ReactNode }[] = [
  { caption: "In a product", tilt: "-rotate-3 lg:translate-y-2", content: <HeroProduct /> },
  { caption: "A form", tilt: "rotate-2 lg:-translate-y-3", content: <HeroForm /> },
  { caption: "On the page", tilt: "-rotate-2 lg:translate-y-4", content: <HeroPage /> },
  { caption: "Labels", tilt: "rotate-3 lg:-translate-y-1", content: <HeroBadges /> },
];

/**
 * Section 2 of the alternative landing: a splash page. Focus lines burst from the headline, a
 * halftone 漫画 watermarks the corner, the sound-effect word slams in, and the live demos fan
 * out below like panels thrown on a desk.
 */
export function SplashHero() {
  return (
    <section
      data-landing="splash-hero"
      aria-labelledby="alt-hero"
      className="relative isolate overflow-hidden border-b"
    >
      <FocusLines center={[50, 28]} count={72} length="long" className="opacity-15" />
      <span
        aria-hidden="true"
        lang="ja"
        className="-z-10 pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 font-display text-[12rem] leading-none text-tone-1 select-none sm:top-20 sm:text-[19rem] lg:top-16 lg:text-[27rem]"
      >
        漫画
      </span>

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 pt-14 text-center sm:px-6 lg:pt-20">
        <div className="flex items-center gap-4">
          <Badge variant="spot" className="-rotate-2">
            Open source
          </Badge>
          <SfxText lang="ja" size="md" rotate={8} enter="pop" aria-hidden="true">
            漫画
          </SfxText>
        </div>

        <h1
          id="alt-hero"
          className="relative font-display text-5xl leading-[1.02] text-balance sm:text-7xl lg:text-8xl"
        >
          Your UI,{" "}
          <SfxText size="xl" enter="slam" rotate={-4} className="mx-1 align-baseline">
            drawn
          </SfxText>{" "}
          by hand.
          <Emanata
            kind="sparkle"
            size="md"
            decorative
            className="absolute -top-6 right-0 lg:-top-8 lg:-right-10"
          />
        </h1>

        <SpeechBubble className="max-w-xl text-base sm:text-lg">
          Dashboards, landing pages, manga readers. shadcn's API, a mangaka's pen.
        </SpeechBubble>

        <div className={cn("w-full max-w-2xl min-w-0 text-left", CODE_WRAPS)}>
          <InstallCommand item="speech-bubble" />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href="/docs/components" size="lg">
            Browse components
          </ButtonLink>
          <ButtonLink href="/docs" variant="outline" size="lg">
            Read the docs
          </ButtonLink>
        </div>
      </div>

      <div className="relative mx-auto mt-14 grid w-full max-w-6xl gap-8 px-6 pb-20 sm:grid-cols-2 lg:flex lg:items-start lg:justify-center lg:gap-0 lg:px-4">
        {FAN.map((cell) => (
          <Panel
            key={cell.caption}
            caption={cell.caption}
            className={cn(
              "min-w-0 bg-paper px-5 pt-7 pb-5 transition-transform duration-300 hover:z-10 hover:rotate-0 hover:scale-[1.02] motion-reduce:transition-none lg:w-[calc(25%+1.25rem)] lg:-mx-2.5",
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
