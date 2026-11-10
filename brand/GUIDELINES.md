# mangacn — Logo Guidelines

## 1. The logo

**Idea:** a hand-inked speech bubble that says one word: **m**. It is drawn with the same rough.js pen and
Dela Gothic One letters as the components, in the theme's ink, paper and one spot red.

| Version | Use it for | File |
|---|---|---|
| Horizontal (primary) | Site header, README, docs, social cards | `logo/mangacn-horizontal.svg` |
| Stacked | Square or tall spaces: stickers, slides, OG images | `logo/mangacn-stacked.svg` |
| Symbol | Avatars, small UI, anywhere the name is already shown | `logo/mangacn-symbol.svg` |
| Symbol, small cut | Anything under 48 px: favicons, app icons, tab icons | `logo/mangacn-symbol-small.svg` |
| Wordmark | Only where the symbol is already nearby | `logo/mangacn-wordmark.svg` |

Every version comes in these colourways:

| Suffix | Colours | Background |
|---|---|---|
| *(none)* | ink, paper, spot red | light (paper or white) |
| `-dark` | the `.dark` theme's ink, paper and spot | dark (the `.dark` paper or near-black) |
| `-black` | black only, no fills | light, one-colour printing, engraving |
| `-white` | white only, no fills | dark or photographic, one-colour |
| `-red` | spot red only, no fills | light, single spot-colour printing |

## 2. Clear space

Keep a clear zone of **one quarter of the bubble's height** on every side, measured from the outer edge of the red
shadow. The zone scales with the logo; never use a fixed distance.

## 3. Minimum size

| Version | Screen | Print |
|---|---|---|
| Horizontal | 120 px wide | 30 mm wide |
| Stacked | 64 px wide | 18 mm wide |
| Symbol (full) | 48 px | 12 mm |
| Symbol, small cut | 16 px | 5 mm |

Below 48 px always use the **small cut**. It has a heavier pen, a calmer line and a solid m without the double outline.
That keeps the bubble and the letter apart at favicon size.

## 4. Colour

The values come from `app/mangacn-theme.css` (OKLCH), converted to sRGB.

| Name | Token | HEX | RGB | CMYK (approx.) | Pantone (nearest) |
|---|---|---|---|---|---|
| Ink | `--ink` | `#0f0d0b` | 15 13 11 | 0 13 27 94 | Black 6 C |
| Paper | `--paper` | `#fdfaf4` | 253 250 244 | 0 1 4 1 | paper stock |
| Spot | `--spot` | `#db1c22` | 219 28 34 | 0 87 84 14 | 485 C |
| Ink (dark) | `.dark --ink` | `#e9e8e5` | 233 232 229 | — | screen only |
| Paper (dark) | `.dark --paper` | `#211f1d` | 33 31 29 | — | screen only |
| Spot (dark) | `.dark --spot` | `#f84c45` | 248 76 69 | — | screen only |

**Approved pairs:**
- full colour on paper or white
- `-dark` on the dark theme's paper or near-black
- `-black` on light backgrounds
- `-white` on dark backgrounds or calm photos
- the small cut on a paper tile (the app icon)

The red only ever appears as the bubble's shadow, never as the letter or the outline.

## 5. Typography

- The **m** and the wordmark are **Dela Gothic One** (SIL Open Font License, so logo use is allowed). Both are
  outlined into paths, so no font is needed to display the logo.
- The hand-drawn wobble comes from rough.js (`roughjs@4.6.6`, the version the components use). Each element has a
  fixed seed, so regenerating the logo gives the same drawing.

## 6. Don'ts

- Don't redraw or re-roughen the logo with new seeds. The wobble is part of the mark.
- Don't type "mangacn" in a font to stand in for the wordmark.
- Don't stretch, rotate or re-space the lockup.
- Don't swap the red shadow to the other side.
- Don't fill the bubble red, and don't colour the m.
- Don't use the full symbol below 48 px. Use the small cut.
- Don't put the full-colour version on dark backgrounds; use `-dark` or `-white`.
- Don't add extra outlines, glows or gradients.

## 7. Files

```
brand/
  GUIDELINES.md          this page
  logo/                  SVG masters (symbol, small cut, horizontal, stacked, wordmark × colourways),
                         mangacn-app-icon.svg, palette.json
  logo/web/              favicon.ico, favicon.svg, favicon-16/32/48.png, apple-touch-icon.png,
                         icon-192/512.png, maskable-512.png, site.webmanifest, head-snippet.html
  board/                 presentation.html + slides/ (logo in use: README, app icon, site, terminal, sticker, social)
  source/kit.js          the generator (see below)
```

**Regenerating:** `source/kit.js` builds every SVG in `logo/`. It needs `roughjs@4.6.6` and `opentype.js@1.3.4`, plus
`DelaGothicOne-Regular.ttf` from `google/fonts` (`ofl/delagothicone`) in a `fonts/` folder next to it. Run it with
`node kit.js <outDir>`.

**Notes:**
- The masters keep rough.js's stroked pen lines rather than outlined fills. They scale cleanly as SVG; for a
  plotter or cutter, expand the strokes in a vector editor first.
- The hand-drawn paths have many more points than a geometric logo would. That is deliberate.
- A trademark search has not been done.
