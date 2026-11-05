# mangacn

Manga-styled React components, distributed as a shadcn registry.

[![CI](https://github.com/fldx-dev/mangacn/actions/workflows/ci.yml/badge.svg)](https://github.com/fldx-dev/mangacn/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](LICENSE)

**Site and docs:** https://www.mangacn.com · **Gallery:** https://www.mangacn.com/demo · **Agents:** https://www.mangacn.com/docs/agents

Every item is drawn like a printed manga page: ink outlines from a rough.js pen, screentone
greys, one spot red, speech bubbles, panels and sound effects. Every item is a shadcn registry
item, so the source lands in your project and stays yours to edit. The restyled primitives keep
shadcn's exports and props, so `@mangacn/button` replaces `button` with no call-site changes.

## Quick start

You need a shadcn project on the `base-nova` style (Base UI), Tailwind CSS v4 and the `cn`
helper that `shadcn init` writes. Next.js is the reference setup; any framework the shadcn CLI
supports works, with your own font loading in place of `next/font`.

1. Name the registry in `components.json`:

   ```json
   {
     "registries": {
       "@mangacn": "https://www.mangacn.com/r/{name}.json"
     }
   }
   ```

2. Install the theme, its three fonts, the ink frame and a first item in one command:

   ```bash
   npx shadcn@latest add @mangacn/theme @mangacn/font-display @mangacn/font-dialogue @mangacn/font-dialogue-ja @mangacn/ink-frame @mangacn/speech-bubble
   ```

   A fresh shadcn project already has stock's `components/ui/button.tsx`, so an add that
   brings mangacn's button asks to overwrite it: answer yes. Scripts and agents pass
   `--overwrite`, because `--yes` alone stops at that question and exits 0 with nothing written.

3. Use it:

   ```tsx
   import { SpeechBubble } from "@/components/speech-bubble";

   export function Line() {
     return <SpeechBubble aria-label="Kenji">Wait… you're the new hero?!</SpeechBubble>;
   }
   ```

After that any item is one `add` away. Each component page on the site shows its exact
command. The CLI also installs straight from this repository without the registry entry:
`npx shadcn@latest add fldx-dev/mangacn/speech-bubble --overwrite`.

| What lands                                        | Where                                                        |
| ------------------------------------------------- | ------------------------------------------------------------ |
| Restyled primitives (`button`, `dialog`, …)       | `components/ui/<item>.tsx`, replacing the stock file         |
| Manga-native pieces (`speech-bubble`, `panel`, …) | `components/<item>.tsx`                                      |
| The ink frame                                     | `components/ink-frame.tsx` (and `roughjs` in `package.json`) |
| Tokens, utilities and keyframes                   | your `globals.css`                                           |
| Font loaders                                      | your root `layout.tsx`                                       |

## What is in the registry

Sixty items, all listed at https://www.mangacn.com/docs/components.

| Group                    | Items                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation               | `theme`, `font-display`, `font-dialogue`, `font-dialogue-ja`, `ink-frame`, `manga-motion`                                                                                                                                                                                                                                                                                             |
| Restyled primitives (33) | `accordion`, `alert`, `alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `collapsible`, `dialog`, `drawer`, `dropdown-menu`, `hover-card`, `input`, `kbd`, `pagination`, `popover`, `progress`, `radio-group`, `select`, `separator`, `sheet`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip` |
| Text                     | `speech-bubble`, `thought-bubble`, `sfx-text`, `vertical-text`, `ink-mark`, `caption-box`                                                                                                                                                                                                                                                                                             |
| Layout and data          | `panel`, `panel-grid`, `manga-frame`, `power-gauge`, `page-number`                                                                                                                                                                                                                                                                                                                    |
| Backgrounds              | `speed-lines`, `focus-lines`, `halftone-background`                                                                                                                                                                                                                                                                                                                                   |
| Decoration               | `emanata`, `ink-arrow`, `stamp`, `ink-splatter`, `sfx-ticker`                                                                                                                                                                                                                                                                                                                         |
| Motion and feedback      | `page-turn`, `ink-splash-loader`                                                                                                                                                                                                                                                                                                                                                      |

The look comes from one theme and one pen. The theme is ink on paper with four screentone
greys and a single spot red, exposed as CSS variables and Tailwind utilities; dark mode swaps
ink and paper. The pen is `InkFrame`, a client component that draws a rough.js outline, fill
and optional shadow behind its children and shows a CSS border until the first drawing, so
server-rendered pages look right before hydration. Every outlined item uses it, which is why
the ink frame comes along with each of them.

Design rules the items follow, and that the docs ask you to keep: hand-drawn edges and no
drop shadows or gradients, spot red at most once per surface, primitives inherit your font
while manga-native pieces set the display or dialogue face, motion opt-in and reduced-motion
safe, accessibility stock or better, and Japanese text under `lang="ja"`.

## For AI agents

Three paths, and they stack. The [Agents](https://www.mangacn.com/docs/agents) page has the
client configs.

- **shadcn's MCP** installs mangacn items as soon as the registry entry above exists:
  `npx shadcn@latest mcp init --client <claude|cursor|vscode|codex>`.
- **The mangacn docs MCP** at `https://www.mangacn.com/api/mcp` is read-only, needs no
  account, and serves seven tools: `search`, `list_pages`, `get_page`, `list_items`,
  `get_item`, `get_install_command` and `get_skill`. `get_item` returns an item's page as
  Markdown, props table included, plus the files it writes.
- **The Agent Skill** carries the workflow and the design rules into Claude Code, Cursor,
  Codex and the other clients the skills CLI supports: `npx skills add fldx-dev/mangacn`.
  Its source is [`skills/mangacn`](skills/mangacn/SKILL.md).

Every docs page has a Markdown twin at its URL plus `.md`, and
[`/llms.txt`](https://www.mangacn.com/llms.txt) indexes them.

## Development

Node 22 and pnpm 10.

```bash
pnpm install
pnpm dev
```

`pnpm dev` first builds the registry into `public/r`, renders the theme CSS and maps the
demos, then starts the docs site on http://localhost:3000. The site reads the same source
as the registry, so a change to an item shows in its docs page and the gallery at once.

| Command                              | What it does                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `pnpm check:changed`                 | Biome on changed files, demo map, typecheck and the tests related to your diff |
| `pnpm check`                         | The same over every file: the full local gate                                  |
| `pnpm test:e2e:changed`              | The Playwright set your diff needs (after `pnpm build`)                        |
| `pnpm registry:smoke --only=<items>` | Installs items into a fresh Next app and builds it                             |
| `pnpm run ci`                        | Everything CI runs on `main`                                                   |

Visual baselines are captured on Linux and live under `e2e/__screenshots__/linux`; a branch
regenerates only the shots its diff touches through the `ci.yml` workflow dispatch with
`update-snapshots`. [registry/ui/README.md](registry/ui/README.md) is the contributor guide:
conventions, the recipes for restyling a primitive and adding a manga-native piece, the import
rules a shipped file must follow, branch naming and the full check loop.

```
registry/        the catalogs: theme/ (theme, fonts, ink-frame, manga-motion), ui/<item>/
app/, components/, content/   the docs site (Next.js App Router, Fumadocs), the landing and /demo
lib/             registry loading, docs rendering, the MCP tools, the e2e filter
skills/mangacn/  the Agent Skill and its references
scripts/         registry build, generators (demos, docs, props, skill, theme CSS), smoke install
e2e/             Playwright visual and MCP suites with their baselines
```

## Built with

[shadcn/ui](https://ui.shadcn.com) (the primitives are restyled from its `base-nova` style, MIT),
[Base UI](https://base-ui.com), [rough.js](https://roughjs.com), [Motion](https://motion.dev),
[Fumadocs](https://fumadocs.dev), and the Google Fonts Dela Gothic One, Shantell Sans and
Yusei Magic.

## License

[MIT](LICENSE).
