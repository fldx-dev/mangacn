import type { ReactNode } from "react";
import { Emanata } from "@/registry/ui/emanata/emanata";
import { FocusLines } from "@/registry/ui/focus-lines/focus-lines";
import { HalftoneBackground } from "@/registry/ui/halftone-background/halftone-background";
import { Panel } from "@/registry/ui/panel/panel";
import { PanelGrid, PanelGridItem } from "@/registry/ui/panel-grid/panel-grid";
import { SfxText } from "@/registry/ui/sfx-text/sfx-text";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";
import { SpeedLines } from "@/registry/ui/speed-lines/speed-lines";
import { ThoughtBubble } from "@/registry/ui/thought-bubble/thought-bubble";
import { PageNumber, TurningPage, TurnPageButton } from "./turning-page";

const ITEMS = [
  "panel-grid",
  "panel",
  "focus-lines",
  "sfx-text",
  "speech-bubble",
  "thought-bubble",
  "halftone-background",
  "emanata",
  "page-turn",
];

/** A background layer kept inside the panel's outline, so lines and dots never cross the ink. */
function Inside({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-1 -z-1 isolate overflow-hidden"
    >
      {children}
    </div>
  );
}

/** Two columns on a phone, three from `sm`; the wide panels span two either way. */
function Page({ children }: { children: ReactNode }) {
  return (
    <PanelGrid
      columns={{ base: 2, sm: 3 }}
      gutter="sm"
      className="auto-rows-[minmax(9rem,auto)] bg-paper p-2 sm:auto-rows-[minmax(11rem,auto)] sm:p-3"
    >
      {children}
    </PanelGrid>
  );
}

function Wide({ children }: { children: ReactNode }) {
  return (
    <PanelGridItem colSpan={2} className="col-span-2">
      {children}
    </PanelGridItem>
  );
}

const PAGE_SEVEN = (
  <Page key="seven">
    <Wide>
      <Panel as="div" className="items-center justify-center">
        <Inside>
          <FocusLines count={72} />
        </Inside>
        <SfxText lang="ja" size="xl" rotate={-8}>
          ドドド
        </SfxText>
      </Panel>
    </Wide>
    <PanelGridItem>
      <Panel as="div" className="items-center justify-start">
        <Inside>
          <HalftoneBackground tone="light" fade="bottom" />
        </Inside>
        <SpeechBubble lang="ja" aria-label="Kenji" className="mt-2">
          遅いぞ。
        </SpeechBubble>
      </Panel>
    </PanelGridItem>
    <PanelGridItem>
      <Panel as="div" className="items-center justify-center">
        <div className="relative">
          <ThoughtBubble lang="ja" className="text-sm sm:text-base">
            ここで合ってる…？
          </ThoughtBubble>
          <Emanata kind="sweat" size="sm" decorative className="absolute -top-2 -right-2" />
        </div>
      </Panel>
    </PanelGridItem>
    <Wide>
      <Panel as="div" caption={<PageNumber />} tone="lines">
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
          <SpeechBubble lang="ja" aria-label="Aiko">
            じゃあ、始めようか。
          </SpeechBubble>
          <TurnPageButton />
        </div>
      </Panel>
    </Wide>
  </Page>
);

const PAGE_EIGHT = (
  <Page key="eight">
    <Wide>
      <Panel as="div" className="items-center justify-center">
        <Inside>
          <SpeedLines direction="left" density="dense" />
        </Inside>
        <SfxText lang="ja" size="xl" rotate={-4}>
          シュッ
        </SfxText>
      </Panel>
    </Wide>
    <PanelGridItem>
      <Panel as="div" className="items-center justify-center">
        <SpeechBubble lang="ja" shape="shout" tail="none" aria-label="Kenji">
          待って！
        </SpeechBubble>
      </Panel>
    </PanelGridItem>
    <PanelGridItem>
      <Panel as="div" tone="halftone" className="items-center justify-center">
        <ThoughtBubble lang="ja" tailSide="right" className="text-sm sm:text-base">
          …まあ、いいか。
        </ThoughtBubble>
      </Panel>
    </PanelGridItem>
    <Wide>
      <Panel as="div" caption={<PageNumber />} tone="lines">
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
          <SpeechBubble lang="ja" aria-label="Aiko">
            続きは、次のページで。
          </SpeechBubble>
          <TurnPageButton />
        </div>
      </Panel>
    </Wide>
  </Page>
);

/** Section 7: one manga page composed from the native pieces, turned by its own button. */
export function WholePage() {
  return (
    <section
      data-landing="whole-page"
      aria-labelledby="landing-page"
      className="overflow-hidden border-t"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 md:py-20">
        <div className="flex flex-col gap-2">
          <h2 id="landing-page" className="font-display text-3xl sm:text-4xl">
            A whole page, in components
          </h2>
          <p className="font-mono text-xs text-muted-foreground sm:text-sm">{ITEMS.join(" · ")}</p>
        </div>
        <TurningPage first={7} pages={[PAGE_SEVEN, PAGE_EIGHT]} />
      </div>
    </section>
  );
}
