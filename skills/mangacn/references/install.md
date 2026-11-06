# Installing mangacn items

The installation guide is `https://www.mangacn.com/docs/installation` (or its `.md`). This
is the same story with the parts an agent trips on.

## Prerequisites

- A shadcn project (`components.json` exists) on the `base-nova` style: the restyled
  primitives are built on Base UI. If there is none, initialise it with
  `pnpm dlx shadcn@latest init -b base -p nova` (it writes `"style": "base-nova"`; at the
  interactive prompt that is "Base UI", then "Nova"). `-p base-nova` fails with "Invalid
  preset".
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
npx shadcn@latest add @mangacn/theme @mangacn/font-display @mangacn/font-dialogue @mangacn/font-dialogue-ja --yes --overwrite
```

Keep `--yes` on any add that names the theme: the CLI asks "You are about to install a new
theme. Existing CSS variables and components will be overwritten. Continue? (y/N)", and
`--overwrite` does not answer it. Without a terminal the run then exits 0 with nothing
written.

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

## The two prompts, `--overwrite` and `--yes`

If a stock or edited file is already there (say `components/ui/button.tsx`, from an earlier
`shadcn add button`), any add that brings mangacn's version (button itself, or an item that
depends on it) asks to overwrite it. The theme asks a question of its own.

- A human at the prompt answers yes.
- An agent or script passes `--overwrite` for the file question and `--yes` for the theme's.
  Neither answers the other: unanswered, the CLI exits 0 before anything is written.
- Every line mangacn prints (the docs pages, `get_item`, `get_install_command`, the catalog)
  already carries them: `--overwrite` always, `--yes --overwrite` when the theme is in the set.

Restyled primitives are meant to replace the stock file: same exports, same props, so
existing call sites keep working.

## GitHub mode, without the registry entry

The shadcn CLI also installs straight from the repository, no `registries` entry needed:

```bash
npx shadcn@latest add fldx-dev/mangacn/speech-bubble --overwrite
```

Same items, by repository path `fldx-dev/mangacn/<item>`. Use it to try one item or when
the hosted registry is out of reach. A plain URL works too:
`npx shadcn@latest add https://www.mangacn.com/r/speech-bubble.json --overwrite`.

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
  with `--overwrite`. After the theme question ("You are about to install a new theme…"),
  rerun it with `--yes --overwrite`.
- A 404 for an item: check the name in [catalog.md](catalog.md); names are kebab-case with no
  `manga-` prefix (`speech-bubble`, not `manga-speech-bubble`).
