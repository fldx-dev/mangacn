import { Badge } from "@/registry/ui/badge/badge";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Emanata } from "@/registry/ui/emanata/emanata";
import { HalftoneBackground } from "@/registry/ui/halftone-background/halftone-background";
import { InkSplashLoader } from "@/registry/ui/ink-splash-loader/ink-splash-loader";
import { Panel } from "@/registry/ui/panel/panel";
import { PanelGrid, PanelGridItem } from "@/registry/ui/panel-grid/panel-grid";
import { Progress, ProgressLabel, ProgressValue } from "@/registry/ui/progress/progress";
import { SfxText } from "@/registry/ui/sfx-text/sfx-text";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";
import { Switch } from "@/registry/ui/switch/switch";
import { ThoughtBubble } from "@/registry/ui/thought-bubble/thought-bubble";
import { VerticalText } from "@/registry/ui/vertical-text/vertical-text";
import { ButtonLink } from "../landing/button-link";

/**
 * Section 5: the catalog as a bento of panels, sized by what each piece needs rather than a
 * uniform grid. Every cell is live.
 */
export function Bento() {
  return (
    <section data-landing="bento" aria-labelledby="alt-bento" className="border-b">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <h2 id="alt-bento" className="font-display text-3xl sm:text-4xl lg:text-5xl">
              The pieces a page is made of
            </h2>
            <p className="max-w-prose text-pretty text-lg">
              Bubbles, sound effects, tones and marks, next to the switches and badges of any app.
            </p>
          </div>
          <ButtonLink href="/docs/components" variant="outline">
            All components →
          </ButtonLink>
        </div>

        <PanelGrid columns={{ base: 1, sm: 2, md: 4 }} gutter="md">
          <PanelGridItem colSpan={2} rowSpan={2}>
            <Panel
              caption="Dialogue"
              className="flex h-full flex-col items-start gap-5 px-5 pt-8 pb-6"
            >
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

          <PanelGridItem colSpan={2}>
            <Panel caption="Sound" className="h-full px-5 pt-8 pb-6">
              <div className="flex flex-1 flex-wrap items-center justify-center gap-x-10 gap-y-6">
                <SfxText lang="ja" size="sm" rotate={-6}>
                  ドン！
                </SfxText>
                <SfxText size="md" rotate={4} color="spot">
                  DOKAN!
                </SfxText>
                <SfxText lang="ja" size="lg" rotate={-3}>
                  バン！
                </SfxText>
              </div>
            </Panel>
          </PanelGridItem>

          <PanelGridItem>
            <Panel caption="Labels" className="h-full px-5 pt-8 pb-6">
              <div className="flex flex-wrap content-start gap-2">
                <Badge>New</Badge>
                <Badge variant="secondary">Ch. 12</Badge>
                <Badge variant="outline">Vol. 3</Badge>
                <Badge variant="spot" lang="ja">
                  完結
                </Badge>
                <Badge variant="destructive">Hiatus</Badge>
              </div>
            </Panel>
          </PanelGridItem>

          <PanelGridItem>
            <Panel caption="Controls" className="h-full gap-4 px-5 pt-8 pb-6 text-sm">
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

          <PanelGridItem colSpan={2}>
            <Panel caption="Tone" className="h-full min-h-56 px-5 pt-8 pb-6">
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

          <PanelGridItem>
            <Panel caption="Marks" className="h-full px-5 pt-8 pb-6">
              <div className="flex flex-1 flex-wrap items-center justify-center gap-5">
                <Emanata kind="sweat" size="md" />
                <Emanata kind="anger" size="md" color="spot" />
                <Emanata kind="sparkle" size="md" />
                <Emanata kind="surprise" size="md" />
                <Emanata kind="puff" size="md" />
              </div>
            </Panel>
          </PanelGridItem>

          <PanelGridItem>
            <Panel caption="Loading" className="h-full px-5 pt-8 pb-6">
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
