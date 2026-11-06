# Design rules

How mangacn looks and why, for anything you style by hand next to the items. The theming
guide (`https://www.mangacn.com/docs/theming`, or its `.md`) has the full values.

## The pen: ink on paper

A manga page is black ink on white paper, shaded with screentone, with one printed spot
colour at most. mangacn keeps to that:

- **Outlines are drawn, not bordered.** Every outlined surface (buttons, inputs, cards,
  dialogs, bubbles, panels) is drawn by rough.js through `InkFrame`: one wobbly stroke of
  `--outline-width`, corners that meet, solid ink or paper fills.
- **No drop shadows, no gradients, no blur, no glass.** Depth comes from screentone and
  heavier strokes. `ink-shadow`, `ink-shadow-sm`, `ink-shadow-spot` and `InkFrame
  shadow="solid" | "hatch"` exist, but only behind an explicit prop (`Card shadow`,
  `Panel shadow`); nothing sets them by default.
- **Near-square corners.** `--radius` is `0.125rem`; stock `rounded-*` classes stay.

## The eight tokens and the one red

| Token                   | Use it for                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `--ink`                 | line work, text, borders, solid fills                                                               |
| `--paper`               | page background, card and popover surfaces                                                          |
| `--spot`                | the single accent: focus ring, destructive, one emphasis                                            |
| `--spot-foreground`     | text on a spot fill                                                                                 |
| `--tone-1` … `--tone-4` | screentone greys, 10 % to 70 %: hover and muted surfaces, disabled fills, muted text, halftone dots |

Each token is a Tailwind colour (`bg-paper`, `text-ink`, `border-ink`, `bg-tone-1`,
`text-spot`). The theme maps shadcn's variables onto them, so stock code that says
`bg-background` or `text-muted-foreground` still renders ink on paper. shadcn's `--accent`
is a hover grey here; the red is `--spot`, never `--accent`.

Rules: no literal colours, widths or radii; use a token or a theme utility. `--spot` appears
where stock uses `destructive` or `ring`, plus at most one deliberate emphasis per surface,
and never as a background for a surface.

Theme utilities you may use on your own markup: `halftone`, `halftone-light`,
`halftone-dark`, `screentone-lines`, `screentone-cross`, `speed-lines`, `paper-grain`,
`ink-border`, `ink-border-heavy`, and the one-shot animations `animate-mangacn-shake`,
`-pop`, `-slam`, `-flash`, `-speed-in`. Screentone is texture: never let a pattern be the
only thing that carries meaning.

## InkFrame on every outline

`InkFrame` (item `ink-frame`, installed to `@/components/ink-frame.tsx`) draws the outline
behind its children into an `aria-hidden` SVG and redraws on resize. Before hydration it
shows a CSS `ink-border` fallback, so server HTML is still outlined.

```tsx
import { InkFrame } from "@/components/ink-frame";

<InkFrame className="p-4" fill="paper">
  <p>A box of your own, drawn with the same pen.</p>
</InkFrame>;
```

Props: `shape` (`"rect" | "ellipse" | "line"`), `fill` (`"none" | "paper" | "ink" | "tone" |
"hatch"`), `shadow` (`"none" | "hatch" | "solid"`), `dashed`, `seed` (a fixed wobble; give
long lists one shared seed), `outline` (a custom path), `as`, `className`. Prefer an item
(`Card`, `Panel`, `CaptionBox`) over a bare frame when one fits.

The pen is CSS variables, so it can change per region: `--outline-width` (1.5px),
`--outline-width-heavy` (panels, dialogs), `--ink-roughness`, `--ink-bowing`, `--ink-offset`,
`--ink-hachure-gap`, `--shadow-offset`. Set them on a wrapper to change every frame inside.

## Restyled primitives: what stays shadcn, what mangacn adds

The primitives (`button`, `dialog`, `select`, `table` and the rest) install to
`components/ui/<name>.tsx` and replace the stock file. They keep, checked by a parity test
against shadcn's `base-nova` style:

- every named export and `data-slot`, so imports and call sites do not change;
- every `cva` variant and value (`variant="outline"`, `size="icon"` …) with its stock meaning;
- every prop (from Base UI), ARIA attribute, keyboard handler and focus style.

They change classes only: the `InkFrame` outline instead of a border, solid ink fills, no
shadows, overlays `bg-ink/70`. The few additions, all optional:

| Item          | Added                                                           |
| ------------- | --------------------------------------------------------------- |
| `button`      | `variant="sfx"`: display face, uppercase, a sound-effect button |
| `badge`       | `variant="spot"`: the one red label                             |
| `card`        | `shadow`: `"none" \| "ink" \| "hatch"`                          |
| `collapsible` | `CollapsibleTrigger variant="glyph"`: the + / − ink glyph       |
| `progress`    | `variant="tone"`: screentone fill                               |
| `skeleton`    | `shape`: `"rect" \| "ellipse"`                                  |
| `table`       | `label`: names the focusable scroll region; one per table       |

Manga-native pieces (`speech-bubble`, `panel`, `sfx-text` …) install to
`components/<name>.tsx` and have their own props; read them from the item's page.

## Dark mode

The `.dark` class on an ancestor (usually `<html>`, as `next-themes` sets it). The night
palette is dim, not inverted: paper becomes a warm charcoal, ink an off-white, and the spot
red brightens a little. Use the tokens and it follows; a literal `bg-black` or `text-white`
breaks it. Every token pair meets WCAG AA in both modes.

The theme defines `.dark` only, with no `prefers-color-scheme` fallback, so a fresh install
stays light until something sets the class. To follow the OS, add `next-themes`: a client
`ThemeProvider` wrapper (`"use client"`, re-exporting `next-themes`' provider) around the
body as `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`, and
`suppressHydrationWarning` on `<html>`, since next-themes sets the class before hydration.
Snippet: `https://www.mangacn.com/docs/theming#turn-it-on`. Do not add a media-query copy of
the dark tokens instead: the items' `dark:` utilities follow the class
(`@custom-variant dark (&:is(.dark *))`), so the page would come out half dark.

## Motion

Motion is opt-in and safe under `prefers-reduced-motion`. The `animate-mangacn-*` utilities
stop under it. The pieces that orchestrate (`page-turn`, `sfx-text`'s `enter`,
`ink-splash-loader`) use `motion/react` and check `useReducedMotion()`: `page-turn`
cross-fades, the loader and `sfx-ticker` hold still. Do the same in your own animation.

## Fonts

| Face            | Utility                  | Use it for                                                                    |
| --------------- | ------------------------ | ----------------------------------------------------------------------------- |
| Dela Gothic One | `font-display`           | sound effects, headings, the `sfx` button, stamps, page numbers, gauge labels |
| Shantell Sans   | `font-dialogue`          | speech and thought bubbles, captions, hand-lettered labels                    |
| Yusei Magic     | (inside `font-dialogue`) | kana and kanji in dialogue, picked per glyph under `lang="ja"`                |

Restyled primitives inherit the project's own font (a settings form stays readable); only
manga-native pieces set `font-display` or `font-dialogue`. Body copy stays in the project's
sans. Add `font-display` to your own headings when the page should read as a manga.

## Accessibility

Decorative pieces (`speed-lines`, `focus-lines`, `halftone-background`, `ink-splatter`) are
`aria-hidden`. Text effects keep the plain text in the DOM. `emanata` is labelled unless you
pass `decorative`. `manga-frame` requires `alt`. Keep the items' roles; do not wrap a
`SpeechBubble` in a `button` to make it clickable.
