import { Badge } from "@/registry/ui/badge/badge";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Emanata } from "@/registry/ui/emanata/emanata";
import { Panel } from "@/registry/ui/panel/panel";
import { PanelGrid, PanelGridItem } from "@/registry/ui/panel-grid/panel-grid";
import { SfxText } from "@/registry/ui/sfx-text/sfx-text";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";
import { SpeedLines } from "@/registry/ui/speed-lines/speed-lines";
import { Switch } from "@/registry/ui/switch/switch";
import { DemoPreview } from "../demo-frame";
import { InstallCommand } from "../install-command";
import { ButtonLink } from "./button-link";

/** The demo box inside a panel: the panel is the frame, so the box drops its own border. */
const IN_PANEL = "min-h-32 border-0 bg-transparent p-2 sm:p-2";

/** Section 2: the pitch on the left, four live demos in a 2×2 panel grid on the right. */
export async function Hero({ total }: { total: number }) {
  const [buttons, bubble, badges] = await Promise.all([
    DemoPreview({ item: "button", demo: "variants", className: IN_PANEL }),
    DemoPreview({ item: "speech-bubble", demo: "japanese", className: IN_PANEL }),
    DemoPreview({ item: "badge", demo: "variants", className: IN_PANEL }),
  ]);

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
          <Badge variant="spot" className="-rotate-2">
            {total} items · shadcn registry · MIT
          </Badge>
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
            Same shadcn API. Swap an import, keep your call sites.
          </SpeechBubble>
          <div className="w-full min-w-0">
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
            <PanelGridItem>
              <Panel as="div" caption="button · variants">
                {buttons}
              </Panel>
            </PanelGridItem>
            <PanelGridItem>
              <Panel as="div" caption="speech-bubble · japanese">
                {bubble}
              </Panel>
            </PanelGridItem>
            <PanelGridItem>
              <Panel as="div" caption="checkbox · switch">
                <div className="flex min-h-32 flex-col items-start justify-center gap-4 p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox id="hero-checkbox" defaultChecked />
                    <label htmlFor="hero-checkbox">Bookmark chapter 12</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="hero-switch" />
                    <label htmlFor="hero-switch">Show furigana</label>
                  </div>
                </div>
              </Panel>
            </PanelGridItem>
            <PanelGridItem>
              <Panel as="div" caption="badge · variants">
                {badges}
              </Panel>
            </PanelGridItem>
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
