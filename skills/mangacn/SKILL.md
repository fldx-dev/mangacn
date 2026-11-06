---
name: mangacn
description: 'Builds manga- and comic-styled React UI with mangacn, a shadcn registry of hand-drawn components: speech and thought bubbles, panels and page grids, sound effects (SFX), screentone backgrounds, ink marks and arrows, stamps, power gauges, page numbers, and restyled shadcn primitives drawn with an ink pen. Use when the user asks for a manga, comic, anime or hand-drawn look, a speech bubble, a sound effect, ink or screentone styling, or names mangacn, @mangacn, www.mangacn.com or the mangacn shadcn registry. Covers setting up the registry, finding an item, reading its props, installing it with the shadcn CLI, composing pages with the design rules (no drop shadows or gradients, one spot red per surface, Japanese under lang="ja") and checking the result.'
license: MIT
metadata:
  site: "https://www.mangacn.com"
  registry: "https://www.mangacn.com/r/{name}.json"
  version: "0.1.0"
---

# mangacn

mangacn is a shadcn registry of manga-styled React components. Every item installs as plain
source with the shadcn CLI. The look comes from one theme (ink on paper, four screentone
greys, one spot red) and one pen: `InkFrame`, a rough.js outline that every outlined item
draws itself with. Your job is to install the right items, use their real props, and keep
the page looking like a printed manga page rather than a SaaS dashboard.

## When to use this skill

- The user wants a manga, comic, anime or hand-drawn look for a page or a component.
- They ask for a piece mangacn has: a speech bubble, a sound effect, a panel layout, a
  screentone background, a hanko stamp, a stat bar, an ink underline.
- They name mangacn, `@mangacn`, `www.mangacn.com` or its registry URL.
- The project already has `"@mangacn"` in `components.json`, or files that import
  `@/components/ink-frame`.

The stack is React with Tailwind CSS v4 and shadcn's `base-nova` style (Base UI). Next.js is
the reference setup; any framework the shadcn CLI supports works the same way.

## Workflow

1. **Set up the registry once.** Add the namespace to `components.json`:

   ```json
   { "registries": { "@mangacn": "https://www.mangacn.com/r/{name}.json" } }
   ```

   Then install the theme, which brings its three fonts:
   `npx shadcn@latest add @mangacn/theme @mangacn/font-display @mangacn/font-dialogue @mangacn/font-dialogue-ja --yes --overwrite`.
   Keep `--yes`: the theme asks "You are about to install a new theme… Continue?", which only
   `--yes` answers, and unanswered the CLI exits 0 having written nothing.
   Skip this when `globals.css` already has `--ink` and `--paper`.

2. **Find the item.** Use the MCP's `search` (free text) or `list_items` (optionally by
   category). Without the MCP, read [references/catalog.md](references/catalog.md) or
   `https://www.mangacn.com/llms.txt`.

3. **Read its API before you write code.** Call `get_item` with the name, or fetch
   `https://www.mangacn.com/docs/components/<item>.md`. Both return the props table and the
   source of every demo. Use only the props listed there; never guess a prop or a variant
   value. Restyled primitives keep shadcn's API, so stock shadcn usage is correct for them.

4. **Install with the one command.** `get_install_command` returns it, and so do the catalog
   and each docs page. One `shadcn add` per item (or one line for a set); dependencies such
   as ink-frame come by URL. Every printed line ends in `--overwrite` (`--yes --overwrite`
   when the theme is in the set); keep the flags. If a stock or edited file is already there
   (say `components/ui/button.tsx`), the CLI asks to overwrite it, and `--overwrite` answers;
   without it an unattended add exits 0 at the question with nothing written. Details:
   [references/install.md](references/install.md).

5. **Compose with the rules.** Pick items by job with
   [references/composing-pages.md](references/composing-pages.md) and keep the three rules
   below. Import primitives from `@/components/ui/<item>` and manga-native pieces from
   `@/components/<item>`.

6. **Check the result.** Compare with the item's docs page or its demo stage,
   `https://www.mangacn.com/demo/<item>/<demo>` (add `?mode=dark` for the night theme), which
   renders one demo alone on paper. Then run the project's typecheck and build.

## Three rules not to break

1. **No drop shadows or gradients; every outline is the pen.** Do not add `shadow-*`,
   `drop-shadow-*`, `bg-gradient-*` or CSS borders to mangacn surfaces. Outlines come from
   the items themselves. For a box of your own, wrap it in `InkFrame`
   (`import { InkFrame } from "@/components/ink-frame"`) instead of `border`. A shadow
   appears only through an item's explicit prop (`Card shadow="ink"`, `Panel shadow`).

2. **`--spot` red once per surface.** The red is for focus rings, destructive actions and at
   most one deliberate emphasis per panel, card or screen region: one SFX word, one stamp,
   one gauge. Never use it as a surface background. Everything else is ink, paper and the
   tone greys (`text-ink`, `bg-paper`, `bg-tone-1` … `bg-tone-4`); no literal colours.

3. **Japanese text goes under `lang="ja"`.** Put it on the element or its nearest wrapper,
   as the mangacn demos do. The dialogue font stack then picks the Japanese face for kana
   and kanji, and screen readers switch voice. See [references/japanese.md](references/japanese.md).

## Connect the MCP

mangacn serves a read-only MCP server at `https://www.mangacn.com/api/mcp`: streamable HTTP,
no account, no key. Its tools are `search`, `list_pages`, `get_page`, `list_items`,
`get_item`, `get_install_command` and `get_skill` (this skill, for agents without a local
copy). In Claude Code:

```bash
claude mcp add --transport http mangacn https://www.mangacn.com/api/mcp
```

Other clients take the same URL as a remote HTTP server; the per-client config is at
`https://www.mangacn.com/docs/agents`.

shadcn's own MCP server installs from any registry in `components.json`, so with the
`@mangacn` line above it can search and add mangacn items too:
`npx shadcn@latest mcp init --client claude` (or `cursor`, `vscode`, `codex`, `opencode`).

No MCP at all? Every docs page has a Markdown twin at `<page URL>.md`, and
`https://www.mangacn.com/llms-full.txt` holds them all in one file.

## References

Open these when the task needs them, not up front:

- [references/design-rules.md](references/design-rules.md): before styling anything by hand.
  The pen, the eight tokens, `InkFrame`, what a restyled primitive keeps from shadcn, dark
  mode, reduced motion and which font goes where.
- [references/install.md](references/install.md): first setup, an overwrite prompt, a failed
  add, installing from GitHub without the registry entry, verifying what landed.
- [references/catalog.md](references/catalog.md): picking an item without the MCP. Every item
  with one line, its install command and its docs URL (generated from the registry).
- [references/japanese.md](references/japanese.md): any Japanese string, vertical writing,
  katakana sound effects, which item uses which face.
- [references/composing-pages.md](references/composing-pages.md): building a page or screen.
  Which item for what, and two worked examples.
- [references/agents-snippet.md](references/agents-snippet.md): when the user wants the rules
  in their own `AGENTS.md` or `CLAUDE.md`.
