# mangacn home: design notes (awwwards pass, 2026-11-14)

This is the design rationale for the home page as of 2026-11-14, as shipped in `39696ff`. It does
not cover the 2026-11-15 changes in `0463b81` (the two-page spread, the ink last page and the
screentone scrollbar). Where these notes and the code on `main` differ, the code is the source of
truth.

## Brief

- Subject: mangacn, manga-styled React components shipped as a shadcn registry (MIT).
- Audience: React developers who already use shadcn/ui; designers making comics, readers, fan sites.
- Job: show in 3 seconds that a stock shadcn UI comes out inked, then get them to install or browse.
- Constraint: built only from mangacn tokens and registry components. No new palette family, no new deps.

## Concepts

|            | Idea                                                                                                                   | Anchor                                                                                                                      | Signature                                                        | O/F/Fe/P                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------- |
| A. Process | The home is a page going through the mangaka's four stages: 下書き pencils, ペン入れ inks, トーン tone, 写植 lettering | The product literally turns stock shadcn (the pencils) into inked UI; the variant data is already a chapter's inking status | A pinned stage where one card is inked by scroll, stage by stage | 4 / 5 / 4 / 1                   |
| B. Formal  | The home is one chapter: every section is a panel on a page, folios in the corners                                     | Manga page layout                                                                                                           | Panels gutter-snap on scroll                                     | 3 / 4 / 4 / 3                   |
| C. Culture | The site reads right to left like a tankōbon                                                                           | Japanese reading order                                                                                                      | Horizontal RTL scroll                                            | 4 / 3 / 2 / 3 (fights the user) |

Pick A: it is the product's own claim made visible, and it can't be moved to another library.
Steal from B: the footer closes the chapter with 完 (the end mark of a manga chapter).

## Concept card

```
Idea:        Your UI goes through the same four stages as a manga page, and mangacn is the ink.
Metaphor:    a mangaka's desk: non-photo blue pencils, pen, screentone, lettering
Signature:   "Four stages" pinned section: the same status card in blue pencil (stock shadcn)
             is inked by a pen line scrubbed by scroll, then toned, then lettered.
Emotion:     the satisfaction of watching an underdrawing get inked
Motion verb: ink over pencil: a hard wipe that follows a pen edge, never a fade
Screenshot:  the half-inked card, blue pencil on the right, ink on the left, nib on the seam
```

## System

- Palette (theme tokens only, plus one desk colour):
  - ground `--paper`, ink `--ink`, muted `--tone-4`, line `--tone-2`, accent `--spot` (rare)
  - pencil `--pencil`: non-photo blue, oklch(0.72 0.11 235) light / oklch(0.62 0.1 235) dark.
    Mangaka draw underdrawings in non-photo blue because scanners drop it. Used only for the
    "not inked yet" state, never for text that has to be read at small sizes.
- Type: Dela Gothic One display (headlines, stage names), Geist body, Geist Mono for labels and
  folios, Shantell Sans / Yusei Magic for dialogue. Display tracking -0.02em at 5xl+.
- Grid: 12 columns in max-w-6xl, 24 px gutter. Hero breaks it on purpose (headline spans 9,
  vertical text column on 11–12). Section rhythm alternates tall (stages, whole page) and short
  (commands, agents).
- Shape: radius `--radius` (0.125rem); outlines are rough.js InkFrame strokes.
- Motion: one ease, cubic-bezier(0.22, 1, 0.36, 1). Ink wipes 600–900 ms, small things 160 ms.
  Scroll-driven parts read one value: `--p` (0..4) on the stages root, from motion's useScroll.
- Folios: each section carries a page number like a printed page (PageNumber), real order.

## Composition

```
HERO (title page)                      STAGES (pinned, 400vh)
+---------------------------+-----+    +----------------+------------------+
| p.1        focus lines    | 縦  |    | 01 下書き Pencils |                  |
| Your UI,                  | 書  |    | 02 ペン入れ Inks  |   [ card: ink | |
| DRAWN                     | き  |    | 03 トーン Tone   |      pencil ]    |
| by hand.   (pencil→ink)   |     |    | 04 写植 Letters |                  |
| [bubble]  [install]       |     |    | caption per stage                 |
| [Browse] [Docs]           |     |    +----------------+------------------+
+---------------------------+-----+
| fan of four live panels         |    ... bento, day/night, page, commands, agents, faq
+---------------------------------+
FOOTER: a final panel, 完 stamp, "Next chapter: the docs", link columns.
```

## Idle state

Hero focus lines turn very slowly (one turn per ~4 min) and the stage nib bobs on the seam.
Both stop under reduced motion.

## Genericness test

- A generic model would centre the hero over a gradient: kept the headline left, broke the
  grid with a vertical Japanese column carrying real info.
- A generic model would fade sections up: no fade-ups; the only scroll motion is the ink wipe.
