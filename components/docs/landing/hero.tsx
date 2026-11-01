import { cn } from "cn";
import type { ReactNode } from "react";
import { Badge } from "@/registry/ui/badge/badge";
import { Emanata } from "@/registry/ui/emanata/emanata";
import { Panel } from "@/registry/ui/panel/panel";
import { PanelGrid, PanelGridItem } from "@/registry/ui/panel-grid/panel-grid";
import { SfxText } from "@/registry/ui/sfx-text/sfx-text";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";
import { SpeedLines } from "@/registry/ui/speed-lines/speed-lines";
import { InstallCommand } from "../install-command";
import { ButtonLink } from "./button-link";
import { CODE_WRAPS } from "./fit";
import { HeroBadges } from "./hero-badges";
import { HeroForm } from "./hero-form";
import { HeroPage } from "./hero-page";
import { HeroProduct } from "./hero-product";

/** The four hero cells: each a small composition sized to its cell, captioned by its idea. */
const CELLS: { caption: string; content: ReactNode }[] = [
  { caption: "In a product", content: <HeroProduct /> },
  { caption: "A form", content: <HeroForm /> },
  { caption: "On the page", content: <HeroPage /> },
  { caption: "Badges and buttons", content: <HeroBadges /> },
];

/** Section 2: the pitch on the left, four live compositions in a 2×2 panel grid on the right. */
export function Hero() {
  return (
    <section
      data-landing="hero"
      aria-labelledby="landing-hero"
      className="relative isolate overflow-hidden"
    >
      <SpeedLines
        direction="radial"
        density="sparse"
        color="tone"
        center={[72, 40]}
        className="opacity-50"
      />
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="flex min-w-0 flex-col items-start gap-6">
          <div className="flex items-center gap-4">
            <Badge variant="spot" className="-rotate-2">
              Open source · MIT
            </Badge>
            {/* An accent, so the Japanese faces show above the fold at every width. */}
            <SfxText lang="ja" size="sm" rotate={8} aria-hidden="true">
              ドン！
            </SfxText>
          </div>
          <h1
            id="landing-hero"
            className="font-display text-4xl leading-[1.1] text-balance sm:text-5xl lg:text-[3.5rem]"
          >
            Manga-styled components,{" "}
            <SfxText size="lg" className="mx-1 align-baseline">
              drawn
            </SfxText>{" "}
            by hand.
          </h1>
          <SpeechBubble className="max-w-md text-base sm:text-lg">
            Dashboards, landing pages, manga readers. Same shadcn API, swap an import.
          </SpeechBubble>
          <div className={cn("w-full min-w-0", CODE_WRAPS)}>
            <InstallCommand item="speech-bubble" />
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

        <div className="relative min-w-0">
          <PanelGrid columns={2} gutter="md" role="group" aria-label="Live demos">
            {CELLS.map((cell) => (
              <PanelGridItem key={cell.caption}>
                <Panel as="div" caption={cell.caption} className="gap-4">
                  <div className="flex flex-1 items-center justify-center">{cell.content}</div>
                </Panel>
              </PanelGridItem>
            ))}
          </PanelGrid>
          <Emanata
            kind="sparkle"
            size="lg"
            decorative
            className="absolute -top-7 -right-2 rotate-12 sm:-right-5"
          />
        </div>
      </div>
    </section>
  );
}
