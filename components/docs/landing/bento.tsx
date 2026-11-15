import { Badge } from "@/registry/ui/badge/badge";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Emanata } from "@/registry/ui/emanata/emanata";
import { HalftoneBackground } from "@/registry/ui/halftone-background/halftone-background";
import { InkSplashLoader } from "@/registry/ui/ink-splash-loader/ink-splash-loader";
import { PageNumber } from "@/registry/ui/page-number/page-number";
import { Panel } from "@/registry/ui/panel/panel";
import { PanelGrid, PanelGridItem } from "@/registry/ui/panel-grid/panel-grid";
import { Progress, ProgressLabel, ProgressValue } from "@/registry/ui/progress/progress";
import { SfxText } from "@/registry/ui/sfx-text/sfx-text";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";
import { Switch } from "@/registry/ui/switch/switch";
import { ThoughtBubble } from "@/registry/ui/thought-bubble/thought-bubble";
import { VerticalText } from "@/registry/ui/vertical-text/vertical-text";
import { ButtonLink } from "./button-link";
import { type Piece, PieceIndex } from "./piece-index";

/** The index beside the sheet: manga's own terms where the form has one. */
const PIECES: Piece[] = [
  { id: "dialogue", en: "Dialogue", ja: "台詞" },
  { id: "sound", en: "Sound", ja: "擬音" },
  { id: "labels", en: "Labels" },
  { id: "controls", en: "Controls" },
  { id: "tone", en: "Tone", ja: "トーン" },
  { id: "marks", en: "Marks", ja: "漫符" },
  { id: "loading", en: "Loading" },
];

/**
 * Section 5: the catalog as a sheet of panels beside a sticky index. Each panel is ruled in from
 * the right as it scrolls into view (the reading direction), and the index marks the one in the
 * middle of the screen. Every cell is live.
 */
export function Bento() {
  return (
    <section data-landing="bento" aria-labelledby="landing-bento" className="border-b">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-12 gap-x-6 gap-y-10 px-4 py-16 sm:px-6 md:py-28">
        <div className="col-span-12 lg:col-span-4">
          <div className="flex flex-col gap-5 lg:sticky lg:top-[calc(var(--fd-nav-height,3.5rem)+3rem)]">
            <PageNumber page={5} side="left" chapter="The pieces" />
            <h2
              id="landing-bento"
              className="font-display text-[clamp(2rem,4.6vw,3.5rem)] leading-[0.95] tracking-[-0.02em] text-balance"
            >
              The pieces a page is made of
            </h2>
            <p className="max-w-sm text-pretty">
              The parts manga has its own words for, next to the switches and badges of any app.
              Every panel here is live.
            </p>
            <div className="hidden lg:block">
              <PieceIndex pieces={PIECES} />
            </div>
            <ButtonLink href="/docs/components" variant="outline" className="self-start">
              All components →
            </ButtonLink>
          </div>
        </div>

        <PanelGrid columns={{ base: 1, sm: 2 }} gutter="md" className="col-span-12 lg:col-span-8">
          <PanelGridItem colSpan={2} data-piece="dialogue" className="landing-rule">
            <Panel caption="Dialogue" className="flex h-full flex-col items-start gap-5 px-5 pb-6">
              <SpeechBubble lang="ja" aria-label="Kenji">
                遅いぞ。もう始まってる！
              </SpeechBubble>
              <SpeechBubble
                lang="ja"
                shape="square"
                tail="bottom-right"
                aria-label="Aiko"
                className="self-end"
              >
                HEROは遅れて来るものよ。
              </SpeechBubble>
              <SpeechBubble lang="ja" shape="shout" tail="none" aria-label="Kenji">
                待って！
              </SpeechBubble>
              <ThoughtBubble lang="ja" className="self-end text-sm sm:text-base">
                ここで合ってる…？
              </ThoughtBubble>
            </Panel>
          </PanelGridItem>

          <PanelGridItem colSpan={2} data-piece="sound" className="landing-rule">
            <Panel caption="Sound" className="h-full px-5 pb-6">
              <div className="flex flex-1 flex-wrap items-center justify-center gap-x-10 gap-y-6">
                <SfxText lang="ja" size="sm" rotate={-6}>
                  東京！
                </SfxText>
                <SfxText size="md" rotate={4} color="spot">
                  KYOTO!
                </SfxText>
                <SfxText lang="ja" size="lg" rotate={-3}>
                  バン！
                </SfxText>
              </div>
            </Panel>
          </PanelGridItem>

          <PanelGridItem data-piece="labels" className="landing-rule">
            <Panel caption="Labels" className="h-full justify-center px-5 pb-6">
              <div className="flex flex-wrap content-start gap-2">
                <Badge>New</Badge>
                <Badge variant="secondary">Ch. 12</Badge>
                <Badge variant="outline">Vol. 3</Badge>
                <Badge variant="spot" lang="ja">
                  完結
                </Badge>
                <Badge variant="destructive">Hiatus</Badge>
                <Badge variant="outline">One-shot</Badge>
                <Badge variant="secondary">Ongoing</Badge>
                <Badge>Full colour</Badge>
              </div>
            </Panel>
          </PanelGridItem>

          <PanelGridItem data-piece="controls" className="landing-rule">
            <Panel caption="Controls" className="h-full gap-4 px-5 pb-6 text-sm">
              <div className="flex items-center gap-2">
                <Switch id="bento-switch" defaultChecked />
                <label htmlFor="bento-switch">Show furigana</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="bento-check" defaultChecked />
                <label htmlFor="bento-check">Bookmark</label>
              </div>
              <Progress value={64} className="w-full">
                <ProgressLabel className="text-xs">Inked</ProgressLabel>
                <ProgressValue className="text-xs" />
              </Progress>
            </Panel>
          </PanelGridItem>

          <PanelGridItem colSpan={2} data-piece="tone" className="landing-rule">
            <Panel caption="Tone" className="h-full min-h-56 px-5 pb-6">
              <HalftoneBackground tone="light" size="md" fade="radial" />
              <div className="flex flex-1 items-center justify-center gap-10">
                <VerticalText lang="ja" className="font-display text-2xl">
                  縦書きも、できる。
                </VerticalText>
                <VerticalText lang="ja" className="font-dialogue text-lg">
                  夕暮れの屋上で。
                </VerticalText>
              </div>
            </Panel>
          </PanelGridItem>

          <PanelGridItem data-piece="marks" className="landing-rule">
            <Panel caption="Marks" className="h-full px-5 pb-6">
              <div className="flex flex-1 flex-wrap items-center justify-center gap-5">
                <Emanata kind="sweat" size="md" />
                <Emanata kind="anger" size="md" color="spot" />
                <Emanata kind="sparkle" size="md" />
                <Emanata kind="surprise" size="md" />
                <Emanata kind="puff" size="md" />
              </div>
            </Panel>
          </PanelGridItem>

          <PanelGridItem data-piece="loading" className="landing-rule">
            <Panel caption="Loading" className="h-full px-5 pb-6">
              <div className="flex flex-1 items-center justify-center">
                <InkSplashLoader label="Inking page 7" size="lg" />
              </div>
            </Panel>
          </PanelGridItem>
        </PanelGrid>
      </div>
    </section>
  );
}
