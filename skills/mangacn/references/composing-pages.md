# Composing pages

Which item does which job, and two pages built from them. Every prop below is real; for
anything else, read the item's page (`get_item` or `/docs/components/<item>.md`).

## Which item for what

| Job                     | Items                                                                                                                     | Notes                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page layout             | `panel-grid`, `panel`                                                                                                     | `PanelGrid` lays panels out with paper gutters; wrap each `Panel` in a `PanelGridItem` for `colSpan` / `rowSpan`. One column on phones.                                |
| A framed surface        | `panel`, `card`                                                                                                           | `Panel` for story content (heavy frame, `tone`, corner `caption`); `Card` for app UI (header, content, footer).                                                        |
| Dialogue                | `speech-bubble`, `thought-bubble`                                                                                         | Name the speaker with `aria-label`. `shape`: `round`, `square`, `shout`, `whisper`; `tail` points at the speaker.                                                      |
| Narration               | `caption-box`                                                                                                             | Square-cornered box; `corner` pins it inside a `Panel`.                                                                                                                |
| Sound                   | `sfx-text`, `sfx-ticker`                                                                                                  | `SfxText` for one word (`size`, `color`, `rotate`, `enter="pop" \| "slam"`); `SfxTicker` for a marquee band.                                                           |
| Annotation, on any page | `ink-mark`, `ink-arrow`                                                                                                   | `InkMark` circles, underlines, boxes, strikes, highlights or brackets inline text; `InkArrow` points at something, with an optional `label`. Work in plain app UI too. |
| Marks                   | `stamp`, `emanata`                                                                                                        | `Stamp`: a hanko seal of one or two words. `Emanata`: sweat, anger, sparkle, surprise, puff beside a face or a heading.                                                |
| Stats                   | `power-gauge`                                                                                                             | A labelled `meter`; stack several in a `Card` for a character sheet. Use `progress` for a task still running.                                                          |
| Readers                 | `page-number`, `page-turn`                                                                                                | `PageNumber` folio (`page`, `of`, `chapter`); `PageTurn` animates when `pageKey` changes.                                                                              |
| Images                  | `manga-frame`                                                                                                             | Image in an ink frame with `aspect`, `matte` and `caption`; `alt` is required.                                                                                         |
| Backgrounds             | `halftone-background`, `speed-lines`, `focus-lines`                                                                       | Decorative, `aria-hidden`, behind content in a `relative` parent. One per surface.                                                                                     |
| Vertical writing        | `vertical-text`                                                                                                           | Japanese titles and dialogue; see japanese.md.                                                                                                                         |
| Loading                 | `ink-splash-loader`, `skeleton`, `progress`                                                                               | Loader for an unknown wait, skeleton for a layout placeholder.                                                                                                         |
| Menus and dialogs       | `dropdown-menu`, `dialog`, `alert-dialog`, `sheet`, `drawer`, `popover`, `hover-card`, `tooltip`, `select`                | Restyled primitives: stock shadcn API and composition, drawn with the heavy pen, no shadow.                                                                            |
| Forms and controls      | `button`, `input`, `textarea`, `checkbox`, `radio-group`, `switch`, `slider`, `toggle`, `toggle-group`, `tabs`            | Stock API. `Button variant="sfx"` for one loud call to action.                                                                                                         |
| Feedback and data       | `alert`, `badge`, `sonner`, `table`, `avatar`, `accordion`, `collapsible`, `separator`, `kbd`, `breadcrumb`, `pagination` | Stock API; `Badge variant="spot"` for the one red label.                                                                                                               |

Rules of thumb:

- Start from structure (grid, panels, cards), then dialogue and captions, then one sound
  effect or mark for emphasis. Decoration last, and sparingly.
- One spot-red element per surface: if the `Stamp` is red (its default), keep the gauges and
  the SFX in ink or paper.
- One background effect per surface. Speed lines behind a halftone behind focus lines is
  noise, not manga.
- Keep body copy in the project's font; the display and dialogue faces are for lettering.

## Example 1: a manga page

A hero section laid out as a page: an establishing panel across the top, two story panels,
a narration caption and a sound effect.

```tsx
import { CaptionBox } from "@/components/caption-box";
import { Panel } from "@/components/panel";
import { PanelGrid, PanelGridItem } from "@/components/panel-grid";
import { SfxText } from "@/components/sfx-text";
import { SpeechBubble } from "@/components/speech-bubble";

export function StoryPage() {
  return (
    <PanelGrid columns={{ sm: 2 }} gutter="sm" className="mx-auto max-w-3xl">
      <PanelGridItem colSpan="full">
        <Panel tone="cross" caption="Tokyo, 3 a.m." className="min-h-40">
          <h1 className="w-fit bg-paper px-1 font-display text-3xl uppercase">
            The city never sleeps
          </h1>
        </Panel>
      </PanelGridItem>
      <PanelGridItem>
        <Panel className="min-h-56">
          <CaptionBox corner="top-left">Meanwhile, on the other side of the city…</CaptionBox>
          <SpeechBubble aria-label="Kenji" lang="ja" className="mt-auto self-end">
            遅いぞ。もう始まってる！
          </SpeechBubble>
        </Panel>
      </PanelGridItem>
      <PanelGridItem>
        <Panel tone="halftone" className="min-h-56 items-center justify-center">
          <SfxText size="lg" color="spot" rotate={-6} enter="slam">
            Kyoto!
          </SfxText>
        </Panel>
      </PanelGridItem>
    </PanelGrid>
  );
}
```

Install: `npx shadcn@latest add @mangacn/panel-grid @mangacn/panel @mangacn/caption-box @mangacn/speech-bubble @mangacn/sfx-text --overwrite`.
The only red is the sound effect; Japanese dialogue is under `lang="ja"`.

## Example 2: a character stat card

App UI with a manga accent: a restyled `Card`, three gauges, an approval stamp and one line
of dialogue.

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PowerGauge } from "@/components/power-gauge";
import { SpeechBubble } from "@/components/speech-bubble";
import { Stamp } from "@/components/stamp";

export function CharacterCard() {
  return (
    // A relative wrapper places the stamp over the card's corner, as the stamp demo does.
    <div className="relative w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle className="font-display uppercase">Aki Moriyama</CardTitle>
          <CardDescription>Inker, Studio Kumo. Level 12.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SpeechBubble aria-label="Aki" tail="top-left" className="self-start">
            Deadline's tomorrow. I'm ready.
          </SpeechBubble>
          <PowerGauge label="Power" value={64} segments={10} />
          <PowerGauge label="Speed" value={82} segments={10} />
          <PowerGauge label="Ink" value={100} segments={10} burst />
        </CardContent>
      </Card>
      <Stamp aria-label="Approved" rotate={12} className="absolute -top-6 -right-2">
        <span lang="ja">承認</span>
      </Stamp>
    </div>
  );
}
```

Install: `npx shadcn@latest add @mangacn/card @mangacn/power-gauge @mangacn/speech-bubble @mangacn/stamp --overwrite`.
The stamp is the one red (its default `color="spot"`), so the gauges stay ink. Card keeps
its stock API; `shadow` is off by default and stays off.

## Checking the page

- Compare each piece with its demo stage: `https://www.mangacn.com/demo/<item>/<demo>`
  (`?mode=dark` for the night theme). Item pages list their demos.
- Look at 360 px wide: panels stack, nothing overflows horizontally.
- Toggle `.dark` on `<html>`: everything should follow the tokens.
- Count the reds, find any `shadow-`, `gradient` or `border` class you added, and check every
  Japanese string sits under `lang="ja"`.
