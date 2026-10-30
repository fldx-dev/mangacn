# registry/ui

Every folder here is one installable item: either a **restyled shadcn primitive**
(`registry:ui`, installs to `@/components/ui/<name>.tsx` and overwrites the stock file)
or a **manga-native piece** (`registry:component`, installs to `@/components/<name>.tsx`).
Users install them with:

```bash
npx shadcn@latest add @mangacn/<name>
```

This file is the contributor guide. You should not need the specs to add an item; if
something here is unclear or wrong, fix this file in the same PR.

## Conventions

### Naming

- `kebab-case`, ASCII, no `manga-`/`mangacn-` prefix: `speech-bubble`, not `manga-speech-bubble`.
- The item `name`, its folder and its main file stem are the same:
  `registry/ui/speech-bubble/speech-bubble.tsx`.
- Restyled primitives keep the stock name (`button`, `radio-group`), so `@mangacn/button`
  replaces `button` with no call-site changes.
- Names are permanent once published. Renaming or removing an item needs maintainer sign-off.

### Folder layout

```
registry/ui/<name>/
├─ <name>.tsx            shipped (the only file listed in files[])
├─ <name>.test.tsx       Vitest + Testing Library, never shipped
└─ demos/
   ├─ default.tsx        required; default export, no props
   └─ <variant>.tsx      optional extra demos (variants.tsx, sizes.tsx, …)
```

| Folder                    | Item type                                                        | Installs to                                               |
| ------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| `registry/theme/`         | `registry:theme`, `registry:font`, `registry:lib`                | css, `app/layout.tsx`, `@/lib/<name>.ts`                  |
| `registry/ui/<name>/`     | `registry:ui` (primitive) or `registry:component` (manga-native) | `@/components/ui/<name>.tsx` or `@/components/<name>.tsx` |
| `registry/blocks/<name>/` | `registry:block`                                                 | `@/components/blocks/<name>/…`                            |

### Catalog entry

Add the item to `registry/ui/registry.json` (never to the root `registry.json`, which only
`include`s the nested catalogs). Required fields:

```json
{
  "name": "speech-bubble",
  "type": "registry:component",
  "title": "Speech Bubble",
  "description": "Dialogue bubble with a tail, in four shapes.",
  "categories": ["text"],
  "meta": { "since": "0.1.0" },
  "dependencies": ["class-variance-authority"],
  "registryDependencies": [],
  "files": [{ "path": "speech-bubble/speech-bubble.tsx", "type": "registry:component" }]
}
```

- `description`: one sentence, at most 140 characters.
- `categories`: at least one of `primitive`, `layout`, `text`, `background`, `feedback`,
  `overlay`, `navigation`, `form`, `data`, `decoration`, `animation`, `block`.
- `meta.since`: the `package.json` version the item first ships in.
- `files[]`: the shipped file only. Demos, tests, fixtures and `__parity__` are never listed.
- `dependencies`: every npm package the shipped file imports (`class-variance-authority`,
  `@base-ui/react`, `motion`, `cn`). Anything beyond those needs maintainer sign-off: users
  pay for it.
- `registryDependencies`: **bare names only** (`button`, never `@mangacn/button`). A
  namespaced name breaks URL and GitHub-mode installs.

Add new entries in spec order (primitives first, then manga-native pieces) so parallel
branches merge as appended array entries.

### What a shipped file may import

Enforced by `registry/ui/imports.test.ts` for every file in every catalog:

| Allowed                                                                                                      | Example                                            |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `react`, `react-dom` (and subpaths)                                                                          | `import * as React from "react"`                   |
| packages in the item's `dependencies` (and subpaths)                                                         | `import { Popover } from "@base-ui/react/popover"` |
| `@/lib/utils`                                                                                                | `import { cn } from "@/lib/utils"`                 |
| `@/components/ui/<x>`, `@/components/<x>`, `@/lib/<x>`, `@/hooks/<x>` where `x` is in `registryDependencies` | `import { Button } from "@/components/ui/button"`  |
| relative imports to another file of the **same** item                                                        | `import { parts } from "./dialog-parts"`           |

Everything else fails with `file:line imports "specifier" (item): reason`: `@/app/…`,
`@/lib/registry/…`, `@/registry/…`, docs-only `@/components/…`, relative imports into
another item, undeclared packages, Node built-ins. Demos and tests may import anything
(they import the item via `@/registry/ui/<name>/<name>`), because they are not shipped.

### Design rules (every item)

1. **Tokens only.** No literal colours, widths or radii. Use theme tokens (`ink`, `paper`,
   `spot`, `tone-1`…`tone-4`, `--outline-width`) and theme utilities (`ink-border`,
   `ink-shadow`, `ink-shadow-sm`, `halftone`, `halftone-light`, `screentone-lines`…). If you
   need a value the theme lacks, ask for a token first; do not invent one here.
2. **Drawn edges, hard shadows, square corners.** Borders are
   `border-[length:var(--outline-width)] border-border`; shadows are `ink-shadow` or
   `ink-shadow-sm`. Stock `rounded-*` classes stay: `--radius` already renders near-square.
3. **Spot colour is rare.** Only where stock uses `destructive` or `ring`, plus at most one
   deliberate emphasis element in a manga-native piece. Never as a surface background.
4. **Primitives inherit the user's font.** Only manga-native pieces set `font-display` or
   `font-dialogue`.
5. **Motion is opt-in and reduced-motion-safe.** One-shot effects use the CSS
   `animate-mangacn-*` utilities. Only pieces that orchestrate (`page-turn`,
   `ink-splash-loader`, `sfx-text`) use `motion`, imported as
   `import { motion, useReducedMotion } from "motion/react"` and checking `useReducedMotion()`.
6. **Accessibility is stock or better.** Keep every ARIA attribute, keyboard handler and
   focus style from stock. Decorative pieces are `aria-hidden`; text effects keep the plain
   text in the DOM.
7. **Responsive.** Every demo renders without horizontal overflow at 360 px.

Code style: double quotes, semicolons, width 100 (Biome enforces it), named exports only in
shipped files, `cva` for variants, `data-slot` on every rendered part, `data-*` for state.

## Recipe 1: restyle a stock primitive

1. **Fetch the current stock source** (never write a primitive from memory). This prints
   the file exactly as the CLI would install it into this repo, without writing anything:

   ```bash
   pnpm dlx shadcn@4.23.0 add https://ui.shadcn.com/r/styles/base-nova/<name>.json --dry-run --view components/ui/<name>.tsx
   ```

   Copy the printed source into `registry/ui/<name>/<name>.tsx`. Do not copy the raw
   `files[0].content` from the JSON instead: it still has shadcn's internal
   `@/app/(create)/components/icon-placeholder` and `@/registry/base-nova/ui/<x>` imports,
   which the CLI turns into `lucide-react` icons and `@/components/ui/<x>`. Keep the item's
   `dependencies` and `registryDependencies` exactly as stock lists them
   (`registry/ui/__parity__/base-nova.json` has the current values).
2. **Add the attribution header** as the first line:

   ```tsx
   // Based on shadcn/ui <Name> (MIT, https://ui.shadcn.com), base-nova, fetched YYYY-MM-DD. Restyled for mangacn.
   ```

3. **Change classes only.** Keep structure, exports, `data-slot` values, variant names and
   keys, comments and order. The diff against stock should read as class changes plus the
   header. Apply this table and leave everything else as stock:

   | Stock                                       | mangacn                                                                       |
   | ------------------------------------------- | ----------------------------------------------------------------------------- |
   | 1 px `border-border` or transparent border  | `border-[length:var(--outline-width)] border-border`                          |
   | `ring-1 ring-foreground/10` hairline        | 2 px ink border, optional `ink-shadow` via a `shadow` variant                 |
   | `shadow-xs` / `shadow-md` on solid controls | `ink-shadow-sm`, plus `active:translate-[1px_1px] active:shadow-none`         |
   | `bg-muted` / `bg-secondary`                 | keep; disabled states add `halftone-light`                                    |
   | `disabled:opacity-50`                       | `disabled:opacity-100 disabled:halftone-light disabled:text-muted-foreground` |
   | `data-checked:bg-primary`                   | keep; thumb/indicator gets `ink-border`                                       |
   | overlay `bg-black/50`                       | `bg-ink/70`                                                                   |
   | popover/tooltip `shadow-md` + 1 px border   | 2 px ink border + `ink-shadow`                                                |
   | tabs underline / pill                       | 2 px ink bottom rule; active tab ink border on three sides                    |
   | progress track                              | `ink-border`; a `tone` variant uses `screentone-lines`                        |
   | skeleton `animate-pulse bg-accent`          | `halftone-light animate-pulse`                                                |
   | separator 1 px                              | `var(--outline-width)` ink                                                    |
   | table row borders                           | 2 px ink header rule, `calc(var(--outline-width)/2)` ink row rules            |
   | avatar `rounded-full`                       | keep round, add `ink-border`                                                  |

   New variants may be **added** (`button` gains `variant="sfx"`); existing keys keep their
   stock meaning, and no stock export is removed or renamed.
4. **Catalog entry:** `"type": "registry:ui"`, `"categories": ["primitive"]` (or a better
   fit), file type `registry:ui`.
5. **Demo and test:** `demos/default.tsx` showing the common case, extra demos for variants
   and sizes, and `<name>.test.tsx` (renders, forwards `className`, sets `data-slot`,
   variants map to classes, and runs axe on the default demo):

   ```tsx
   import { expectNoA11yViolations } from "@/lib/test/axe";
   import ButtonDefaultDemo from "./demos/default";

   it("has no axe violations in its default demo", async () => {
     await expectNoA11yViolations(<ButtonDefaultDemo />);
   });
   ```
6. **Run the checks** (below).

## Recipe 2: add a manga-native piece

1. Create `registry/ui/<name>/<name>.tsx`:

   ```tsx
   import { cva, type VariantProps } from "class-variance-authority";
   import type * as React from "react";
   import { cn } from "@/lib/utils";

   const thingVariants = cva("ink-border bg-paper text-ink", {
     variants: { size: { sm: "p-2", md: "p-4" } },
     defaultVariants: { size: "md" },
   });

   export interface ThingProps
     extends React.HTMLAttributes<HTMLDivElement>,
       VariantProps<typeof thingVariants> {}

   export function Thing({ className, size, ...props }: ThingProps) {
     return (
       <div
         data-slot="thing"
         data-size={size ?? "md"}
         className={cn(thingVariants({ size }), className)}
         {...props}
       />
     );
   }
   ```

   Add `"use client"` only if the piece uses state, effects, refs or `motion`. Tails,
   bursts and marks are CSS (pseudo-elements, `clip-path`) or small inline SVG; no images.
2. **Catalog entry:** `"type": "registry:component"`, file type `registry:component`,
   `dependencies` listing every package the file imports (`["class-variance-authority"]` for
   the example above; `@/lib/utils` is always available and is not a dependency).
3. **Demo and test** as in recipe 1. A demo is a default export with no props that imports
   the piece from `@/registry/ui/<name>/<name>`:

   ```tsx
   import { Thing } from "@/registry/ui/thing/thing";

   export default function ThingDefaultDemo() {
     return <Thing>Dokan!</Thing>;
   }
   ```

4. **Run the checks** (below).

## Run the checks

```bash
pnpm gen:demos       # regenerate the demo map (also runs in predev/prebuild/ci)
pnpm test            # unit tests, import rule, demo map staleness, stock parity
pnpm run ci          # the `ci` job: lint, typecheck, tests, validate, build, smoke install
pnpm build && pnpm test:e2e   # the `visual` job: every demo × 360/768/1280 px × light/dark
```

Preview a demo in isolation with `pnpm dev` and open
`http://localhost:3000/demo/<name>/<demo>` (add `?mode=dark` for the night theme). The
page renders that one demo centred on paper and nothing else.

`pnpm gen:demos` fails with the item name if `demos/default.tsx` is missing, and
`pnpm test` fails if the generated map is stale; rerun `pnpm gen:demos`.

### Stock parity

`registry/ui/parity.test.ts` compares every restyled primitive (a `registry:ui` item whose
name is one of the 21 stock primitives) with `registry/ui/__parity__/base-nova.json`:
named exports, `data-slot` values and both dependency lists must equal stock; every stock
`cva` variant group and key must still exist (added keys such as `variant="sfx"` are fine).
A failure lists what is missing or unexpected. Primitives not restyled yet show as `todo`.

The snapshot is refreshed only on purpose, after a shadcn release, with maintainer
sign-off: `pnpm gen:parity` (network; never runs in CI), then review the diff.

### Accessibility and visual snapshots

- `expectNoA11yViolations(<Demo />)` (`lib/test/axe.ts`) renders the demo and runs axe on
  `document.body`, so portalled popups are checked too. `color-contrast` and `region` are
  off in jsdom (no layout, no page landmarks); theme contrast has its own test.
- `e2e/demos.spec.ts` opens `/demo/<item>/<demo>` and `?mode=dark` for every demo in the
  generated map at 360, 768 and 1280 px, fails on console errors, non-200 responses and
  horizontal overflow, and on Linux compares against
  `e2e/__screenshots__/linux/w<width>/<item>-<demo>-<mode>.png` (`maxDiffPixelRatio` 0.01).
  On Windows and macOS it skips the pixel comparison, because font rendering differs.
- A new demo has no baseline, so the `visual` CI job fails until you add one. Baselines are
  only made on CI: run the workflow manually with `update-snapshots` checked
  (`gh workflow run ci.yml -f update-snapshots=true`), download the `playwright-baselines`
  artifact into `e2e/__screenshots__/` (`gh run download <run-id> -n playwright-baselines -D e2e/__screenshots__`),
  look at the new PNGs, and commit them with the item.
