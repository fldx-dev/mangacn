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
| `registry/theme/`         | `registry:theme`, `registry:font`, `registry:lib`, `ink-frame`   | css, `app/layout.tsx`, `@/lib/<name>.ts`, `@/components/` |
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

| Allowed                                                                                                      | Example                                             |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `react`, `react-dom` (and subpaths)                                                                          | `import * as React from "react"`                    |
| packages in the item's `dependencies` (and subpaths)                                                         | `import { Popover } from "@base-ui/react/popover"`  |
| `@/lib/utils`                                                                                                | `import { cn } from "@/lib/utils"`                  |
| `@/components/ui/<x>`, `@/components/<x>`, `@/lib/<x>`, `@/hooks/<x>` where `x` is in `registryDependencies` | `import { Button } from "@/components/ui/button"`   |
| `@/components/ink-frame` (installed explicitly, never declared; see recipe 1)                                | `import { InkFrame } from "@/components/ink-frame"` |
| relative imports to another file of the **same** item                                                        | `import { parts } from "./dialog-parts"`            |

Everything else fails with `file:line imports "specifier" (item): reason`: `@/app/…`,
`@/lib/registry/…`, `@/registry/…`, docs-only `@/components/…`, relative imports into
another item, undeclared packages, Node built-ins. Demos and tests may import anything
(they import the item via `@/registry/ui/<name>/<name>`), because they are not shipped.

### Design rules (every item)

1. **Tokens only.** No literal colours, widths or radii. Use theme tokens (`ink`, `paper`,
   `spot`, `tone-1`…`tone-4`, `--outline-width`, `--ink-roughness`…) and theme utilities
   (`ink-border`, `halftone`, `halftone-light`, `screentone-lines`…). If you need a value the
   theme lacks, ask for a token first; do not invent one here.
2. **Hand-drawn edges, no shadow by default.** Every outline is drawn by rough.js through
   `InkFrame` (recipe 1): one wobbly `--outline-width` stroke, corners that meet, solid ink
   fills. No CSS borders or shadows on outlined surfaces; `ink-shadow*` and `InkFrame
   shadow` only behind an explicit prop. Stock `rounded-*` classes stay.
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
   which the CLI turns into `lucide-react` icons and `@/components/ui/<x>`. Keep
   `registryDependencies` exactly as stock lists them
   (`registry/ui/__parity__/base-nova.json` has the current values). For `dependencies`,
   list every package the file imports: stock items declare only `cn`, because
   `@base-ui/react`, `class-variance-authority` and `lucide-react` come with the base-nova
   style at `shadcn init`; mangacn declares them so installs into other setups get them too.
2. **Add the attribution header** directly after the import block, before the first
   declaration. Not above the imports: `shadcn add` drops everything before a file's first
   statement, so a top-of-file comment never reaches the user. The smoke install checks
   that the installed `components/ui/button.tsx` has it in this position.

   ```tsx
   import { cn } from "cn";

   // Based on shadcn/ui <Name> (MIT, https://ui.shadcn.com), base-nova style, fetched YYYY-MM-DD.
   // Restyled for mangacn.

   const buttonVariants = cva(
   ```

3. **Change classes, and draw outlines with `InkFrame`.** Keep exports, `data-slot` values,
   variant names and keys, comments and order. The diff against stock should read as class
   changes, the header and the frame. Apply this table and leave everything else as stock:

   | Stock                                       | mangacn                                                                       |
   | ------------------------------------------- | ----------------------------------------------------------------------------- |
   | 1 px `border-border` or transparent border  | `border-0`; an `InkFrame` layer draws the outline (below)                     |
   | `bg-primary` solid fill                     | keep the class (server render); the frame gets `fill="ink"`                   |
   | `ring-1 ring-foreground/10` hairline        | `InkFrame`; an explicit `shadow` variant may pass `shadow="hatch"`            |
   | `shadow-xs` / `shadow-md`                   | removed; press feedback is `active:translate-[1px_1px]` only                  |
   | `bg-muted` / `bg-secondary`                 | keep; disabled states add `halftone-light` and draw with `fill="none"`        |
   | `disabled:opacity-50`                       | `disabled:opacity-100 disabled:halftone-light disabled:text-muted-foreground` |
   | `data-checked:bg-primary`                   | keep; the indicator gets its own `InkFrame` with a shared `seed`              |
   | overlay `bg-black/50`                       | `bg-ink/70`                                                                   |
   | popover/tooltip/dialog `shadow-md` + border | `InkFrame` at `[--outline-width:var(--outline-width-heavy)]`, no shadow       |
   | tabs underline / pill                       | `InkFrame shape="line"` rule; active tab outlined on three sides              |
   | progress track                              | `InkFrame` track; a `tone` variant uses `screentone-lines`                    |
   | skeleton `animate-pulse bg-accent`          | `halftone-light animate-pulse`, no outline                                    |
   | separator 1 px                              | `InkFrame shape="line"` filling a `var(--outline-width)` box                  |
   | table row borders                           | `shape="line"` rules, header at `--outline-width-heavy`                       |
   | avatar `rounded-full`                       | `InkFrame shape="ellipse"`                                                    |

   **The frame layer.** `InkFrame` (`registry/theme/ink-frame/ink-frame.tsx`, installed to
   `@/components/ink-frame.tsx`) is a client component that draws a rough.js outline, fill
   and optional shadow into an `aria-hidden` SVG behind its children, and shows a CSS
   `ink-border` until the first drawing (server render, no JavaScript, and a few frames
   after a cold load until hydration). In a primitive it is the **first child** of the stock
   element rather than a wrapper around it, so `className`, `render` and layout stay stock
   and host selectors such as `[&>svg]:size-3!` never reach the drawing. Use `as="span"`:
   buttons and badges only allow phrasing content. `registry/ui/button/button.tsx` is the
   reference:

   ```tsx
   import { InkFrame } from "@/components/ink-frame";

   // Host classes: add `relative isolate border-0`, drop border and shadow classes, and clear
   // the CSS fill once the frame has drawn: `has-[>[data-inked=true]]:bg-transparent!`.
   <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props}>
     <InkFrame as="span" fill="ink" className="pointer-events-none absolute inset-0 -z-1" />
     {children}
   </ButtonPrimitive>
   ```

   Tests stub `ResizeObserver` with `stubResizeObserver()` from `lib/test/resize-observer.ts`
   to make the frame draw in jsdom; `data-fill` and `data-shape` on the frame expose what it
   draws.
   - `fill`: `ink` for solid (`bg-primary`) variants, `paper` for outlined ones, `tone` for
     `bg-secondary`, `none` when disabled (so the halftone shows). Ghost and link variants
     render no frame: stock draws no border for them.
   - Colours are CSS variables, so `[--ink:var(--spot)]` on the host turns the stroke (and an
     ink fill) spot, and hover can retint a fill: `hover:[--paper:var(--tone-1)]`.
   - Heavy outlines: `className="[--outline-width:var(--outline-width-heavy)]"` on the frame.
   - Cost: one SVG per outlined element, redrawn only on resize. Long lists pass one shared
     `seed` and prefer `shape="line"` row rules over full frames.
   - **Do not declare it.** `registryDependencies: ["ink-frame"]` would resolve to shadcn's
     registry and `@mangacn/ink-frame` breaks URL installs, so `registryDependencies` stay
     equal to stock (parity is unchanged) and users install it first:
     `npx shadcn@latest add @mangacn/ink-frame @mangacn/button`. The import rule allows
     `@/components/ink-frame` for this reason, `tsconfig.json` and `vitest.config.mts` map it
     to the source file in this repo, and the smoke test installs `ink-frame` before every
     other item. Once mangacn.com is live, items will declare its full URL instead.

   New variants may be **added** (`button` gains `variant="sfx"`); existing keys keep their
   stock meaning, and no stock export is removed or renamed. Where stock already has a
   modifier for the same state, reuse it: stock `button` presses with
   `active:not-aria-[haspopup]:translate-y-px`, so mangacn uses
   `active:not-aria-[haspopup]:translate-[1px_1px]`, which `cn` merges over the stock class
   (a plain `active:` class would sit next to it and the two would fight).
4. **Catalog entry:** `"type": "registry:ui"`, `"categories": ["primitive"]` (or a better
   fit), file type `registry:ui` and `"target": "@ui/<name>.tsx"`. The target is required:
   without it shadcn keeps the folder after `ui/` in the source path and installs
   `components/ui/<name>/<name>.tsx` next to the stock file instead of replacing it.
   `@ui/` resolves against the user's own `ui` alias.
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
named exports, `data-slot` values and `registryDependencies` must equal stock;
`dependencies` must contain every stock package (more is fine); every stock `cva` variant
group and key must still exist (added keys such as `variant="sfx"` are fine).
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
