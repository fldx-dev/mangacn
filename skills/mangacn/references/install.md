# Installing mangacn items

The installation guide is `https://www.mangacn.com/docs/installation` (or its `.md`). This
is the same story with the parts an agent trips on.

## Prerequisites

- A shadcn project (`components.json` exists). If not, run `npx shadcn@latest init` and pick
  the `base-nova` style: the restyled primitives are built on Base UI.
- Tailwind CSS v4 (the theme ships `@utility` blocks and CSS variables).
- The `cn` helper at `@/lib/utils`, which `shadcn init` writes.

## 1. The registries entry

Add the namespace to `components.json`, beside what is already there:

```json
{
  "registries": {
    "@mangacn": "https://www.mangacn.com/r/{name}.json"
  }
}
```

`@mangacn/<item>` now resolves to the hosted item file. shadcn's MCP server reads the same
entry, so it can search and install mangacn items once this line exists.

## 2. The theme, once

```bash
npx shadcn@latest add @mangacn/theme @mangacn/font-display @mangacn/font-dialogue @mangacn/font-dialogue-ja --overwrite
```

The theme writes the tokens, utilities and keyframes into `globals.css`. The three font
items add `next/font/google` loaders to the root `layout.tsx`: Dela Gothic One
(`--font-display`), Shantell Sans (`--font-dialogue-latin`) and Yusei Magic
(`--font-dialogue-ja`). Outside Next.js, skip the font items and set those three variables
to faces you load yourself.

## 3. One add per item

```bash
npx shadcn@latest add @mangacn/speech-bubble --overwrite
```

Each item declares what it needs. mangacn dependencies are declared by full URL
(`https://www.mangacn.com/r/ink-frame.json`), so ink-frame, and mangacn's button for
`dialog`, `sheet`, `alert-dialog` and `pagination`, come along on every install path.
The documented commands still list `@mangacn/ink-frame` first for outlined items; that is
redundant and harmless. Several items can go in one command:
`npx shadcn@latest add @mangacn/panel @mangacn/panel-grid @mangacn/caption-box --overwrite`.

Use the project's runner: `npx`, `pnpm dlx`, `yarn dlx` or `bunx --bun`, followed by
`shadcn@latest add …`.

## The overwrite prompt and `--overwrite`

A fresh `shadcn init` already wrote stock `components/ui/button.tsx`. Any add that brings
mangacn's button (button itself, or an item that depends on it) asks to overwrite it.

- A human at the prompt answers yes.
- An agent or script passes `--overwrite`. `--yes` alone does not answer that question: the
  CLI stops there and exits 0 before the item is written, so nothing was installed.

Restyled primitives are meant to replace the stock file: same exports, same props, so
existing call sites keep working.

## GitHub mode, without the registry entry

The shadcn CLI also installs straight from the repository, no `registries` entry needed:

```bash
npx shadcn@latest add fldx-dev/mangacn/speech-bubble --overwrite
```

Same items, by repository path `fldx-dev/mangacn/<item>`. Use it to try one item or when
the hosted registry is out of reach. A plain URL works too:
`npx shadcn@latest add https://www.mangacn.com/r/speech-bubble.json`.

## Verify an install

| Check               | Where                                                          |
| ------------------- | -------------------------------------------------------------- |
| Restyled primitives | `components/ui/<item>.tsx` (the stock file, replaced)          |
| Manga-native pieces | `components/<item>.tsx`                                        |
| The pen             | `components/ink-frame.tsx`, and `roughjs` in `package.json`    |
| The theme           | `globals.css` defines `--ink`, `--paper`, `--spot` and `.dark` |
| The fonts           | the root `layout.tsx` loads the three faces                    |

Then run the project's typecheck and build. A missing `@/components/ink-frame` import means
ink-frame did not land: add `@mangacn/ink-frame`. An item that renders without its outline
before hydration and with it after is working as intended.

## When an add fails

- An error naming the `@mangacn` registry: the `registries` entry is missing or misspelled.
- The command exits 0 after an overwrite question but the item file is missing: rerun it
  with `--overwrite`.
- A 404 for an item: check the name in [catalog.md](catalog.md); names are kebab-case with no
  `manga-` prefix (`speech-bubble`, not `manga-speech-bubble`).
