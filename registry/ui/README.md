# registry/ui

Every folder here is one installable item: either a **restyled shadcn primitive**
(`registry:ui`, installs to `@/components/ui/<name>.tsx` and overwrites the stock file)
or a **manga-native piece** (`registry:component`, installs to `@/components/<name>.tsx`).
Users install them with:

```bash
npx shadcn@latest add @mangacn/<name> --overwrite
```

(`--yes --overwrite` when `@mangacn/theme` is in the set; `lib/docs/install-command.ts` prints
every install line on the site, in the skill and in the MCP with those flags.)

This file is the contributor guide. You should not need the specs to add an item; if
something here is unclear or wrong, fix this file on the same branch.

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
| `registry/blocks/<name>/` | `registry:block` (recipe 3)                                      | `@/components/blocks/<name>/…`                            |
| `registry/hooks/`         | `registry:hook` (recipe 4), one `<name>.ts` each                 | `@/hooks/<name>.ts`                                       |

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
  "registryDependencies": ["https://www.mangacn.com/r/ink-frame.json"],
  "files": [{ "path": "speech-bubble/speech-bubble.tsx", "type": "registry:component" }]
}
```

- `description`: one sentence, at most 140 characters.
- `categories`: at least one of `primitive`, `layout`, `text`, `background`, `feedback`,
  `overlay`, `navigation`, `form`, `data`, `decoration`, `animation`, `block`, `hook`.
- `meta.since`: the `package.json` version the item first ships in.
- `files[]`: the shipped file only. Demos, tests, fixtures and `__parity__` are never listed.
- `dependencies`: every npm package the shipped file imports (`class-variance-authority`,
  `@base-ui/react`, `motion`, `cn`). Anything beyond those needs maintainer sign-off: users
  pay for it.
- `registryDependencies`: stock shadcn items mangacn does not restyle by **bare name**,
  mangacn items by **full URL** (`https://www.mangacn.com/r/ink-frame.json`, and restyled
  primitives: `https://www.mangacn.com/r/button.json`), never `@mangacn/<name>`: a
  namespaced name only resolves when the user configured `@mangacn`, so URL and GitHub-mode
  installs fail, and a bare mangacn name resolves to shadcn's registry. Declare every
  mangacn item a shipped file imports, and nothing it does not import (the theme's fonts are
  the exception: they install no file to import). `registry/ui/imports.test.ts` enforces it.

Add new entries in spec order (primitives first, then manga-native pieces) so parallel
branches merge as appended array entries.

### What a shipped file may import

Enforced by `registry/ui/imports.test.ts` for every file in every catalog:

| Allowed                                                                                                 | Example                                             |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `react`, `react-dom` (and subpaths)                                                                     | `import * as React from "react"`                    |
| packages in the item's `dependencies` (and subpaths)                                                    | `import { Popover } from "@base-ui/react/popover"`  |
| `@/lib/utils`                                                                                           | `import { cn } from "@/lib/utils"`                  |
| `@/components/ui/<x>`, `@/components/<x>`, `@/lib/<x>` where `x` is in `registryDependencies`           | `import { Button } from "@/components/ui/button"`   |
| the same for a mangacn item declared by URL (`https://www.mangacn.com/r/ink-frame.json`; see recipe 1)  | `import { InkFrame } from "@/components/ink-frame"` |
| `@/hooks/<x>` only where `x` is declared by URL (`https://www.mangacn.com/r/use-mobile.json`; recipe 4) | `import { useIsMobile } from "@/hooks/use-mobile"`  |
| relative imports to another file of the **same** item                                                   | `import { parts } from "./dialog-parts"`            |

Everything else fails with `file:line imports "specifier" (item): reason`: `@/app/…`,
`@/lib/registry/…`, `@/registry/…`, docs-only `@/components/…`, relative imports into
another item, undeclared packages, Node built-ins. Demos and tests may import anything
(they import the item via `@/registry/ui/<name>/<name>`), because they are not shipped.
Blocks follow a stricter version of this table (recipe 3); a hook imports React only (recipe 4).

### Design rules (every item)

1. **Tokens only.** No literal colours, widths or radii. Use theme tokens (`ink`, `paper`,
   `spot`, `tone-1`…`tone-4`, `--outline-width`, `--ink-roughness`…) and theme utilities
   (`ink-border`, `halftone`, `halftone-light`, `screentone-lines`…). If you need a value the
   theme lacks, ask for a token first; do not invent one here.
2. **Hand-drawn edges, no shadow by default.** Every outline is drawn by rough.js through
   `InkFrame` (recipe 1): one wobbly `--outline-width` stroke, corners that meet, solid ink
   fills. No CSS borders or shadows on outlined surfaces; `ink-shadow*` and `InkFrame
   shadow` only behind an explicit prop. Stock `rounded-*` classes stay.
   **Composition primitives draw one outline:** a wrapper (`input-group`, `button-group`) draws
   the frame and sets `data-grouped`, and the items inside read it (`in-data-grouped:`) to
   draw none of their own, so an input in a group shows one ink frame, not two.
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
   text in the DOM. A button that navigates is an anchor drawn as a button:
   `<Button nativeButton={false} role="link" render={<a href="…" />}>`. Base UI marks every
   non-native button `role="button"`, an `<a href>` included, so `role="link"` is needed (the
   button page's `link` demo; the landing's `ButtonLink` wraps the same recipe).
7. **Responsive.** Every demo renders without horizontal overflow at 360 px.

Code style: double quotes, semicolons, width 100 (Biome enforces it), named exports only in
shipped files, `cva` for variants, `data-slot` on every rendered part, `data-*` for state.

### Branches and commits

Work happens on short-lived branches off `main`, named by what they change, not by who or
which task made them:

| Prefix   | For                                  | Example                                           |
| -------- | ------------------------------------ | ------------------------------------------------- |
| `feat/`  | a new item, demo, page or capability | `feat/add-page-turn`, `feat/docs-install-command` |
| `fix/`   | a behaviour or visual fix            | `fix/badge-label`, `fix/ink-line-ends`            |
| `chore/` | tooling, dependencies, CI, scripts   | `chore/fast-local-loop`                           |
| `docs/`  | site content and guides              | `docs/theming-guide`                              |
| `test/`  | tests and baselines only             | `test/site-visual-suite`                          |

Slugs are kebab-case. A Claude Code session's worktree branch is named by the app
(`claude/<slug>-<suffix>`); that local name stays local. Publish under the conventional name
with an explicit refspec and keep pushing to it:

```bash
git push -u origin HEAD:refs/heads/feat/add-page-turn
```

Commit subjects carry the matching prefix (`feat:`, `fix:`, `chore:`, `docs:`, `test:`), one
change per commit. Baselines land on `main`, from the wave's update run (see "Run the checks").
Branches are merged into `main` with a merge commit and deleted afterwards.

## Recipe 1: restyle a stock primitive

1. **Fetch the current stock source** (never write a primitive from memory). This prints
   the file exactly as the CLI would install it into this repo, without writing anything:

   ```bash
   pnpm dlx shadcn@4.23.0 add https://ui.shadcn.com/r/styles/base-nova/<name>.json --dry-run --view components/ui/<name>.tsx
   ```

   Copy the printed source into `registry/ui/<name>/<name>.tsx`. Do not copy the raw
   `files[0].content` from the JSON instead: it still has shadcn's internal
   `@/app/(create)/components/icon-placeholder` and `@/registry/base-nova/ui/<x>` imports,
   which the CLI turns into `lucide-react` icons and `@/components/ui/<x>`. Keep every
   stock `registryDependencies` name (`registry/ui/__parity__/base-nova.json` has the
   current values) and add the `ink-frame` URL (step 3). For `dependencies`,
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
   | skeleton `animate-pulse bg-accent`          | `InkFrame fill="hatch"` in `--tone-3` (pencil hatching), `animate-pulse`      |
   | separator 1 px                              | `InkFrame shape="line"` filling a `var(--outline-width)` box                  |
   | table row borders                           | `shape="line"` rules, header at `--outline-width-heavy`                       |
   | avatar `rounded-full`                       | `InkFrame shape="ellipse"`                                                    |
   | badge pill (`rounded-4xl`, `text-xs`)       | caption-box label: `rounded-sm`, `font-display` 11 px uppercase, no press     |

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
   - Shapes beyond rect/ellipse/line (a bubble with its tail, a shout burst): pass
     `outline={(width, height) => "M … Z"}`, an SVG path in border-box pixels drawn with the same
     pen, fill and shadow (`shape` still picks the CSS fallback). Memoise it with `useCallback`:
     a new function redraws, and the component passing it needs `"use client"`.
     `registry/ui/speech-bubble/speech-bubble.tsx` is the reference. `dashed` dashes the stroke.
   - Cost: one SVG per outlined element, redrawn only on resize. Long lists pass one shared
     `seed` and prefer `shape="line"` row rules over full frames.
   - **Declare it as a URL.** Add `"https://www.mangacn.com/r/ink-frame.json"` to
     `registryDependencies`, after stock's names (`["https://…/button.json",
     "https://…/ink-frame.json"]` for `dialog`), so `npx shadcn@latest add @mangacn/button` installs the frame too, in URL,
     namespaced and GitHub mode alike. Not `ink-frame` (that resolves to shadcn's registry)
     and not `@mangacn/ink-frame` (that fails unless the user configured `@mangacn`). Parity
     allows these URL additions on top of stock's names. `tsconfig.json` and
     `vitest.config.mts` map `@/components/ink-frame` to the source file in this repo.

   Cases the first-child rule does not cover (Tasks 23–25 found these):
   - **Void elements** (`input`, `textarea`) cannot hold the frame, so the `InkFrame` wraps
     them (`<InkFrame as="span" fill="paper" className="flex w-full min-w-0">`); the stock
     element keeps `data-slot`, `className` and props. Size the field from its parent.
   - **Scroll containers** clip the drawing (it reaches 8 px out). Hang the frame on a
     non-scrolling ancestor of the same size: `select` puts it on the Positioner.
   - **Elements that cannot hold a `<span>`** (`<tr>`): draw from the children. `table`
     cells each ink their segment of the row rule, overlapping by `--outline-width`. Inside a
     scroll container a drawing that reaches past the content scrolls with it, so the first
     and last cells' rules stop flush with the table and clip their drawing (`overflow-x-clip`).
   - **Stock selectors that count children** (`card`'s `>img:first-child`) shift by one;
     rewrite them (`[data-slot=ink-frame]+img`, `img:nth-child(2)`).
   - **Frames above content** (`avatar` outlines over the image) go last with `z-1` and
     `fill="none"`.
   - **Checked fills and state-only frames:** a second frame with the **same `seed`** lands
     exactly on the first (checkbox/radio indicators); frames shown only in some states
     are `hidden` and revealed with a CSS variant (tabs). A hidden frame draws when it
     becomes visible, and the e2e wait skips it while hidden.
   - **Overlays:** `bg-ink/70` with `dark:bg-paper/70` (in dark mode ink is the light tone).

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

   Overlays render open in their default demo (`defaultOpen`) so the baselines capture
   them. Toasts have no open state: a `sonner` demo fires its toasts in an effect on mount
   (a fixed `id`, so a double effect does not stack two, and `duration: Infinity`) and
   renders the `Toaster`; `e2e/ready.ts` waits until each toast is mounted and framed. A demo that passes `render={<Button />}` must start with `"use client"`: an
   element serialized from a server component loses the children Base UI merges into it
   (jsdom tests do not catch this; the page shows empty buttons). An item that imports a
   `registryDependencies` entry (`dialog` → `@/components/ui/button`) needs that path mapped
   to the source in `tsconfig.json` `paths` and the `vitest.config.mts` aliases, as
   `@/components/ink-frame` is. **A stock dependency on a restyled primitive is declared by
   its mangacn URL** (`dialog` → `https://www.mangacn.com/r/button.json` in place of stock's
   `button`; parity accepts the URL of the same name), so `@mangacn/dialog` alone installs
   mangacn's button, not shadcn's (shadcn asks to overwrite the stock button `shadcn init`
   wrote).

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

   Add `"use client"` only if the piece uses state, effects, refs or `motion`. Tails and
   bursts are rough.js paths through `InkFrame`'s `outline` prop; emanata and other marks are
   small inline SVG; no images. `motion` imports are `motion` and `useReducedMotion`, plus
   `AnimatePresence` only for a keyed exit animation (`page-turn`).
   Outlines go through `InkFrame` (recipe 1), including custom shapes via its `outline` prop.
   Decorative backgrounds (`speed-lines`, `focus-lines`, `halftone-background`) render one
   `aria-hidden` layer with `pointer-events-none absolute inset-0 -z-1`; the user places it as
   the first child of a `relative isolate` container. **Nothing paints past the layer**: hosts
   such as `panel` do not clip, and a drawing past the layer bleeds over the frame or widens a
   phone page. A layer that draws past its box puts `overflow-hidden` on itself (`focus-lines`;
   `speed-lines` too, though its gradients stay inside). It is a plain box, never a `size-full`
   SVG, so a user's `inset-*` class moves its edges instead of pushing it out of the host;
   inline SVG goes inside it. Say so in the props table: a `className` prop whose JSDoc names
   the parent it fills and that it clips.
2. **Catalog entry:** `"type": "registry:component"`, file type `registry:component`,
   `dependencies` listing every package the file imports (`["class-variance-authority"]` for
   the example above; `@/lib/utils` is always available and is not a dependency), and
   `registryDependencies: ["https://www.mangacn.com/r/ink-frame.json"]` if it imports
   `InkFrame`.
3. **Demo and test** as in recipe 1. A demo is a default export with no props that imports
   the piece from `@/registry/ui/<name>/<name>`:

   ```tsx
   import { Thing } from "@/registry/ui/thing/thing";

   export default function ThingDefaultDemo() {
     return <Thing>Dokan!</Thing>;
   }
   ```

4. **Run the checks** (below).

## Recipe 3: add a block

A block is a page in miniature: it **composes items and draws nothing of its own**. Outlines,
captions, stamps and folios are the items'; the block owns layout, keyboard handling and
announcements. Props are data in, callbacks out. `chapter-list` is the reference.

1. **Folder.** One entry file named after the block, any part files beside it:

   ```
   registry/blocks/<name>/
   ├─ <name>.tsx            entry (shipped, first in files[])
   ├─ <part>.ts(x)          parts (shipped): a hook, a helper (chapter-list/chapter-numeral.ts)
   ├─ <name>.test.tsx       never shipped
   └─ demos/default.tsx     required, as for items
   ```

   `"use client"` only in the files that hold state; a block without state is a server
   component (the client-component line on its page reads the entry file's directive).
2. **Catalog entry** in `registry/blocks/registry.json`, appended in spec order. Every shipped
   file is listed with type `registry:block` and its target under `@components/blocks/<name>/`
   (`@components/` resolves against the user's `components` alias; without a target shadcn
   flattens the files into `components/`, and a literal `@/components/…` target is written into
   a folder named `@`). Every item the block renders is declared by URL, never by bare name:

   ```json
   {
     "name": "chapter-list",
     "type": "registry:block",
     "title": "Chapter List",
     "description": "Chapter index for a series: …",
     "categories": ["block"],
     "meta": { "since": "0.1.0" },
     "dependencies": ["cn"],
     "registryDependencies": [
       "https://www.mangacn.com/r/caption-box.json",
       "https://www.mangacn.com/r/separator.json"
     ],
     "files": [
       {
         "path": "chapter-list/chapter-list.tsx",
         "type": "registry:block",
         "target": "@components/blocks/chapter-list/chapter-list.tsx"
       },
       {
         "path": "chapter-list/chapter-numeral.ts",
         "type": "registry:block",
         "target": "@components/blocks/chapter-list/chapter-numeral.ts"
       }
     ]
   }
   ```

   `registry/blocks/catalog.test.ts` checks the type, the `block` category, the entry file
   first, every target and the URL-only dependencies.
3. **Imports.** A block's files may import React, its `dependencies`, `@/lib/utils`, its own
   part files relatively (`./chapter-numeral`), and the install path of each item it declares:
   `@/components/ui/<x>` for a restyled primitive, `@/components/<x>` for a manga-native piece
   or `ink-frame`, and `@/components/blocks/<x>/<file>` for a block it composes (a block may
   compose blocks: `reader` declares `spread-viewer` and `chapter-list` by URL). Nothing else: no
   undeclared item or block, no `@/lib/<x>` it did not declare, no `@/components/blocks/…` path
   to its own parts. `registry/ui/imports.test.ts` enforces it.
   Map each declared item to its source in `tsconfig.json` `paths` and the
   `vitest.config.mts` aliases, as `@/components/ink-frame` is, so the block typechecks and
   tests in this repo.
4. **Demo, test, page.** Demos import the block from `@/registry/blocks/<name>/<name>`. The
   test covers the block's logic and runs axe on every demo. `pnpm gen:docs` scaffolds
   `content/docs/blocks/<name>.mdx` (with `<ItemFiles>`, the files one add writes) and adds it
   to the Blocks sidebar section; write the prose. The props interface is `<Pascal>Props` in
   the entry file, generated by `pnpm gen:props`; a data type the props use gets its own
   `<PropsTable item="<name>" name="<Type>" />` so readers see its fields. `pnpm gen:skill`
   adds the block to the skill catalog's Blocks group; `list_items` and `get_item` (with the
   Files line) pick it up from the catalog.
5. **The smoke** on `main` (`pnpm registry:smoke`, in main's CI run) installs the block with
   its items, checks every file in `files[]` landed at its target, then typechecks and builds
   the fresh app. Locally, `pnpm registry:build && pnpm registry:smoke --only=<name>` does the
   same when an install needs debugging; `--changed` selects a block whose folder changed.

## Recipe 4: add a hook

A hook is a stock React hook that a restyled primitive needs (`use-mobile`, which `sidebar`
reads). It ships unchanged but for the attribution header, has **no demo, no docs page and no
index card**, and installs with the item that declares it. `use-mobile` is the reference.

1. **Fetch the stock source** as in recipe 1, at the hooks path:

   ```bash
   pnpm dlx shadcn@4.23.0 add https://ui.shadcn.com/r/styles/base-nova/<name>.json --dry-run --view hooks/<name>.ts
   ```

   Copy it to `registry/hooks/<name>.ts` (one flat file, no folder), Biome-format it, and add the
   attribution header after the imports (`// Based on shadcn/ui <name> (MIT, https://ui.shadcn.com),
   base-nova style, fetched YYYY-MM-DD.`). A hook imports React and the platform only: no
   registry item, no package, no `@/lib/utils`, no other file (`registry/ui/imports.test.ts`).
2. **Catalog entry** in `registry/hooks/registry.json`, appended. The file's target is
   `@hooks/<name>.ts`: `@hooks/` resolves against the user's own `hooks` alias, so the file lands
   in `hooks/` (or wherever their components.json points it). A literal `@/hooks/…` target is
   written into a folder named `@`; no target also lands in `hooks/` (the CLI places a
   `registry:hook` by type) but every mangacn file states its target (Task 84's spike).

   ```json
   {
     "name": "use-mobile",
     "type": "registry:hook",
     "title": "Use Mobile",
     "description": "Stock hook useIsMobile: true below 768 px, …",
     "categories": ["hook"],
     "meta": { "since": "0.1.0" },
     "files": [
       { "path": "use-mobile.ts", "type": "registry:hook", "target": "@hooks/use-mobile.ts" }
     ]
   }
   ```

   `registry/hooks/catalog.test.ts` checks the type, the `hook` category, the one file at
   `registry/hooks/<name>.ts`, its target, and that the hook depends on no registry item.
3. **Use it from an item or a block.** Declare it by URL, never by bare name (a bare
   `use-mobile` installs shadcn's own copy), and import it from its install path:

   ```json
   "registryDependencies": ["https://www.mangacn.com/r/use-mobile.json", "…"]
   ```

   ```tsx
   import { useIsMobile } from "@/hooks/use-mobile";
   ```

   Map the path to `registry/hooks/<name>.ts` in `tsconfig.json` `paths` and the
   `vitest.config.mts` aliases (as `@/hooks/use-mobile` is), so the item typechecks and tests
   here. One `add` of the item then writes the hook too, and the item's Files line (its page's
   `<ItemFiles>`, `get_item`) names `hooks/<name>.ts` among what its dependencies add.
4. **Test, catalogs, smoke.** A unit test beside the hook (`registry/hooks/<name>.test.ts`,
   stubbing what jsdom lacks, such as `matchMedia`). `pnpm gen:skill` lists it in the skill
   catalog's Hooks group; `list_items` lists it as `registry:hook` (filter `hook`). Main's
   smoke checks that `hooks/<name>.ts` landed with its header, then typechecks and builds the
   fresh app; locally, `pnpm registry:build && pnpm registry:smoke --only=<name>` does the same
   when an install needs debugging, and `--changed` selects a hook whose
   `registry/hooks/<name>.*` files changed.

## Run the checks

Task branches get no CI. A task session checks its own work locally and pushes; the
orchestrator merges every push into `main` at once; CI runs on `main` once per wave of tasks,
and whatever that run finds is fixed on `main`. The gate is not weaker for it: main's run is
the full one (every shot, every item smoked), and the loop only stops each branch from waiting
for it. The loop, in order, for a branch that adds or changes items:

```bash
pnpm gen:theme                                       # once, in a fresh worktree
pnpm check:changed                                   # while you work and before the push: Biome on changed files, demo map, typecheck, related tests
pnpm dev                                             # then look at every new or changed demo, light and dark, at 360 px and desktop width (below)
git push -u origin HEAD:refs/heads/<type>/<slug>     # then message the orchestrator: the branch and its last commit
```

A task session does not dispatch `ci.yml` or wait for a run, and does not run `pnpm build`,
`pnpm registry:smoke`, `pnpm check:catalog` or a full `pnpm run ci`; it commits no baseline
PNG. When the catalog, a props interface or a page's description changed, it runs
`pnpm gen:docs`, `pnpm gen:props` and `pnpm gen:skill` and commits what they write (each
takes `--check` to see whether it is needed).

**Every new or changed demo, by eye, before the push.** With `pnpm dev` running, open
`http://localhost:3000/demo/<item>/<demo>` (and `?mode=dark`) in a window 360 px wide and in
a desktop-wide one, or shoot it (`playwright screenshot` has no viewport option, so a short
script; one URL and file each):

```bash
pnpm exec node -e "const{chromium}=require('@playwright/test');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:360,height:800}});await p.goto(process.argv[1]);await p.waitForTimeout(2000);await p.screenshot({path:process.argv[2],fullPage:true});await b.close()})()" "http://localhost:3000/demo/<item>/<demo>?mode=dark" <scratch>/<item>-<demo>-dark-w360.png
```

The file is for your eyes, not a baseline (Windows fonts differ from the runner's); write it
outside the repo. In batch 3, four of five second CI runs came from a PNG that was wrong at
360 px.

**The orchestrator, on each push**, merges the branch into `main` (appended catalog entries
are the usual conflict), then runs on the merged tree the generator checks
(`pnpm gen:docs --check`, `gen:props --check`, `gen:skill --check`), whole-tree Biome
(`pnpm exec biome check .`), `pnpm typecheck` and the unit suite (`pnpm test`), and pushes
`main`. There is no per-branch run and no per-task go-ahead.

**Once per wave, on `main`.** Main's push run checks, smokes every item and takes every shot;
a new demo has no baseline, so its `visual` job is red until the wave's one dispatch writes
them, which is expected between waves:

```bash
gh workflow run ci.yml --ref main -f update-snapshots=true   # the wave's one dispatch
gh run watch <id> --exit-status
gh run download <id> -n playwright-baselines -D e2e/__screenshots__   # look at every PNG, commit them on main
```

With `update-snapshots=true` the `visual` job runs every non-pixel assertion (status, console
errors, overflow, axe) and rewrites only the baselines that are missing or fail the
comparison (`--update-snapshots=changed`); the `baselines` job merges the four shards' parts
into one `playwright-baselines` artifact holding exactly those, so the download is a straight
copy. Playwright's `changed` mode turns only a failed `toHaveScreenshot` into a write; any
other failure still fails the test, and a red shard uploads nothing. Look at the PNGs (the run
summary lists them): every one must belong to an item the wave added or changed, or one that
uses it; anything else is a regression to fix on `main`, not a baseline. An update run that
rewrote nothing has passed the visual suite as is. `update-snapshots=all` is the exact mode,
used in a batch's proof (with `full=true`, so the landing's full-page shot, taken only under
`SITE_FULL=1`, is in it): every shot is taken without comparing and written when its bytes
differ, under `maxDiffPixelRatio` too, so a baseline a small change left stale is caught;
byte-identical PNGs do not change in git, so the diff (and the artifact) is the stale set.

1. **`pnpm check:changed`** is the gate while you work: about 75 s on Windows for a one-item
   change (Biome on your files, `gen:demos`, typecheck, the test files that import what you
   touched) against several minutes for `pnpm check` (every file, about 1,270 tests). Vitest
   reruns every test when `package.json` or its config changed. Run `pnpm check` when you
   changed shared code (`lib/registry`, the theme, `ink-frame`).
2. **The catalog suites** (`vitest run lib/mcp lib/docs lib/registry components`) read the
   catalog from disk and pin item strings (a description in `lib/mcp/tools.test.ts`), so
   Vitest's `--changed` does not select them; the orchestrator's unit suite on the merged tree
   runs them. Run them yourself when you changed a description or a page.
3. **Optional, when a demo misbehaves** and you want the non-pixel checks before pushing:
   `pnpm build && pnpm test:e2e:changed` (the demo stage is a production build, about 3 min
   on Windows; then the visual set your diff needs, without pixels: errors, overflow, axe), or
   `pnpm check:catalog`, which adds the catalog suites and the component index's Playwright
   pass (each default demo against its 20rem stage and its `h2` outline) and stops at the
   first failure with that step's exit code (`scripts/check-catalog.ts`).

A full local `pnpm run ci` or `pnpm registry:smoke` costs 25–40 min on Windows (timed when the
catalog had 60 items; it holds 89 now, so expect more); main's run does both.

What CI costs (GitHub runner), from batch 4:

| Run                                                                         | Time                                                                                          |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A wave: the ten item tasks of batch 4 (86 to 95), four sessions in parallel | all ten primitives on `main` after about 1 h 35 min; every task merged after about 2 h 20 min |
| `visual`, every shot, a plain run in four shards                            | about 5 min wall time (12 to 15 min on one runner before the split)                           |
| `visual`, an alias-only one-item change (`visual` on that item alone)       | 1 m 48 s                                                                                      |

`checks`, `smoke` and the four `visual` shards start together, so a run waits for the longest
of them (usually a `visual` shard), not their sum. Vitest runs on the `vmThreads` pool: the
unit run fell from 75 s to about 40 s on CI (jsdom set-up from 39 % of the tracked time to
4 %) and from 72 s to 28 s on Windows.

What a change needs before the push:

| Change                                                     | before the push                                    | `test:e2e:changed` selects |
| ---------------------------------------------------------- | -------------------------------------------------- | -------------------------- |
| item (component, demo, catalog entry)                      | `check:changed`, every demo by eye, the generators | items, their users, `site` |
| docs site (`content/`, `components/`, `app/`, `lib/docs/`) | `check:changed`, the docs suites, the page by eye  | `site` (+ `mcp`)           |
| MCP (`lib/mcp/`, `app/api/mcp/`, `skills/`)                | `check:changed`, the `lib/mcp` suite               | `mcp` (3 tests, no pixels) |
| Markdown, scripts, CI                                      | `check:changed`                                    | `none`                     |

### The visual set (`E2E_ITEMS`)

`E2E_ITEMS` is a comma-separated list of item names (their demos) and the suites `site`,
`mcp` and `annotations`; unset or `all` runs everything, `none` nothing. The Playwright run
prints the filter on its first line, and a name with no demos is an error. Set it by hand
(`E2E_ITEMS=slider,site pnpm test:e2e`) or let `scripts/changed-e2e.ts` compute it from the
diff against origin/main (`pnpm exec tsx scripts/changed-e2e.ts` prints it and why;
`--paths=a,b` tries paths without changing them). The rules, in `lib/e2e-filter.ts`:

- an item's folder or catalog entry → that item, every item that uses it (its
  `registryDependencies` or an import in its folder, transitively), and `site`, whose component
  index renders every default demo; `ink-mark` and `ink-arrow` add `annotations`;
- a baseline PNG → its item (or `site` for `site-*.png`);
- `lib/mcp/`, `app/api/mcp/`, `skills/`, `e2e/mcp.spec.ts` → `mcp`; `content/`, `lib/docs/`
  and `scripts/gen-props.ts` → `mcp` and `site` (the MCP serves the pages and props tables);
  other `app/`, `components/`, `e2e/site.spec.ts` → `site`;
- `tsconfig.json` whose diff only adds path aliases → the items they name and the items that
  use them, without `site` (`@/components/ui/<x>` and `@/components/<x>` name `<x>`,
  `@/components/blocks/<x>/...` the block `<x>`, `@/hooks/<x>` the item whose folder holds its
  target); `lib/registry/parity.ts` whose diff only appends names to `PARITY_PRIMITIVES` →
  those items; `vitest.config.mts` reaches no shot at all. The diff is read from the file's
  content at the merge base and now, not from its path;
- everything: the suite's config, demo spec or `e2e/ready.ts`, the demo stage (`app/demo/`),
  `app/layout.tsx`, `app/globals.css`, `ink-frame`, the rest of `lib/registry/` and any other
  change to the two files above (a `compilerOptions` edit, a removed, edited or reordered
  alias or name, an alias that names no item), `lib/utils.ts`, the theme catalog or any item's
  `css`, a dependency (`pnpm-lock.yaml`, `package.json` outside `scripts`), the Next config,
  and any path no rule knows;
- nothing: unit tests, Markdown, `scripts/` (but the demo, theme and docs generators), CI.

CI (`.github/workflows/ci.yml`): push to main and pull requests always run every shot and the
full smoke, and so does a dispatch on `main`. A `workflow_dispatch` on a branch (not part of
the fast loop) runs the `items` input, or the computed set when it is empty, and its `smoke`
job installs only the changed items (`registry:smoke --changed`) while `checks` runs beside
it; `full=true` runs what main runs. `visual` is four Playwright shards (`--shard=<n>/4`), each
building the site for its own quarter of the tests. Playwright's browser is cached per
version, so apt (`install-deps`) runs only on a cache miss.

Coverage and its 90 % threshold are enforced in CI (`pnpm test:coverage`), not in `pnpm test`.
`pnpm run ci` is the whole CI gate locally (25–40 min on Windows, timed at 60 items); leave
it to CI. It is `pnpm run ci:checks` followed by the smoke; CI runs `ci:checks` and `ci:smoke`
(`registry:build` then `registry:smoke`) as the parallel `checks` and `smoke` jobs.

Preview a demo in isolation with `pnpm dev` and open
`http://localhost:3000/demo/<name>/<demo>` (add `?mode=dark` for the night theme). The
page renders that one demo centred on paper and nothing else.

`pnpm gen:demos` fails with the item name if `demos/default.tsx` is missing, and
`pnpm test` fails if the generated map is stale; rerun `pnpm gen:demos`.

`pnpm registry:list` (`shadcn list` against `pnpm dev` on `http://localhost:3000`) exits 0.
Listing the live registry (`shadcn list https://www.mangacn.com/r/registry.json`) on Windows
with Node 26.3.1 prints all items and then exits 127 with libuv's `Assertion failed:
!(handle->flags & UV_HANDLE_CLOSING)` (`src/win/async.c`, line 94): libuv aborting at Node's teardown after
the https fetch. Plain `node node_modules/shadcn/dist/index.js list <url>` does the same, so it
is the CLI process under that Node, not pnpm's script wrapper; the listing is complete, read
the output and ignore the code (checked 2026-11-09, shadcn 4.23.0; CI runs Node 22 from
`.nvmrc`).

### Stock parity

`registry/ui/parity.test.ts` compares every restyled primitive (a `registry:ui` item whose
name is in `PARITY_PRIMITIVES` in `lib/registry/parity.ts`, 55 since batch 4) with
`registry/ui/__parity__/base-nova.json`: named exports and `data-slot` values must equal stock; `registryDependencies` must contain
stock's names and may add only `https://www.mangacn.com/r/<name>.json` entries;
`dependencies` must contain every stock package (more is fine); every stock `cva` variant
group and key must still exist (added keys such as `variant="sfx"` are fine).
A failure lists what is missing or unexpected. Primitives not restyled yet show as `todo`.

The snapshot is refreshed only on purpose, after a shadcn release, with maintainer
sign-off: `pnpm gen:parity` (network; never runs in CI), then review the diff.

### Accessibility and visual snapshots

- Every item test calls `expectDemosAccessible(import.meta.glob("./demos/*.tsx"))`
  (`lib/test/axe.ts`) inside its `describe`: one case per demo, rendered with ResizeObserver
  stubbed and every ink frame drawn, axe on `document.body` so portalled popups are checked
  too. Options: `setup` (stubs the demos need before rendering: layout, matchMedia) and
  `ready` (per demo, what to wait for before axe: an open drawer, a toast). The glob, not the
  generated map, keeps each item test related to its own demos only under `--changed`;
  `lib/registry/demo-axe.test.ts` fails when an item with demos has no such call, so a new
  item cannot ship demos without axe. `expectNoA11yViolations(<ui />)` remains for one-off
  states. The rules off everywhere are in `lib/test/axe-rules.ts`: `color-contrast` (no
  layout in jsdom; the theme's contrast has its own test, and the stage pages run the rule
  on its own, below), `region` and `page-has-heading-one`
  (page-level; a demo is a fragment, shown in an iframe). jsdom cannot evaluate
  `label-content-name-mismatch` (it measures glyphs on a canvas: the "HTMLCanvasElement's
  getContext()" lines in the unit run), so the stage-page pass is where that rule bites.
- `e2e/demos.spec.ts` opens `/demo/<item>/<demo>` and `?mode=dark` for every demo in the
  generated map at 360, 768 and 1280 px, fails on console errors, non-200 responses,
  horizontal overflow and (light mode, every width) axe violations on the drawn stage page,
  with the same rule set and Base UI's focus guards excluded (`[data-base-ui-focus-guard]`:
  visually hidden `tabindex="0"` spans with `aria-hidden` that an open select or menu
  portals and that hand focus on at once; Base UI has no option to drop them, as in
  `e2e/site.spec.ts`). Then, in both modes and at every width, it runs `color-contrast` on its
  own: the pen's fills are first painted as CSS (`e2e/ink-fills.ts`) so axe can measure text
  over them, and text it cannot measure (over a screentone, under an SFX outline) comes back
  incomplete, not failed. `CONTRAST_EXEMPTIONS` in `lib/test/axe-rules.ts` names text that may
  stay below AA, by item, demo and selector, with a reason from a short fixed list; it is
  empty. On Linux the spec compares against
  `e2e/__screenshots__/linux/w<width>/<item>-<demo>-<mode>.png` (`maxDiffPixelRatio` 0.01).
  On Windows and macOS it skips the pixel comparison, because font rendering differs.
- `e2e/site.spec.ts` shoots each site page whole, except the landing and the component index:
  those are shot at their first viewport, from the top of the page
  (`site-home-viewport-<mode>.png`, `site-docs-components-viewport-<mode>.png`). The index is
  never shot whole (every new item moved that picture): it is checked structurally at every
  width instead (one card per catalog item with demos, each with its title linking to its
  page and its description, no card past the viewport's edges, no page overflow), and every
  demo has its own baseline. The landing is also shot whole (`site-home-<mode>.png`) under
  `SITE_FULL=1`, which CI sets on main (push or dispatch) and on `full` dispatches. New items
  do not move the landing; a change to the landing is regenerated by the wave's update run
  (or a batch proof's `full=true` run).
- The overlay item pages and the gallery (`OVERLAY_PAGES` in `e2e/site.spec.ts`: dialog,
  popover, context-menu, menubar and `/demo/dialog`) embed live stages whose popup opens on
  load. An embedded stage holds its script-driven focus and `scrollIntoView` until the reader
  interacts with it (`lib/docs/stage-focus.ts`), so the page keeps the reader's focus and
  scroll; the suite asserts that and runs its axe pass on each of those pages, stages
  included, at every width in light mode.
- A new demo has no baseline, so `visual` on `main` fails until the wave's
  `update-snapshots=true` dispatch writes it (the loop above); baselines are only made on CI,
  and the orchestrator commits them on `main`.
- `visual` runs in four shards; each uploads the PNGs it rewrote, and the `baselines` job
  merges them into the one `playwright-baselines` artifact.
- Every `InkFrame` without an explicit `seed` hashes `useId()`, and React ids depend on the
  tree above the component. Changing the demo stage's tree (`app/demo/[item]/[demo]/page.tsx`)
  therefore changes every wobble; such a change selects every shot, and the update run
  rewrites each one that moved past the threshold. Two runs of the same commit also differ in
  a few dozen PNGs by one to a few hundred pixels (renderer antialiasing at text and stroke
  edges); that is within the threshold, so `--update-snapshots=changed` leaves them alone, but
  `--update-snapshots=all` (the `all` dispatch, `pnpm test:e2e:update`) rewrites them, since it
  writes every shot whose bytes differ: expect those few dozen in every exact regeneration.

## Docs page per item

Every catalog item with demos has a page at `content/docs/components/<item>.mdx` (a block at
`content/docs/blocks/<block>.mdx`), and the site (`/docs/components/<item>`,
`/docs/blocks/<block>`) is built from it. `pnpm gen:docs` writes the page for any item that
has none (never overwriting one) and rewrites `content/docs/components/meta.json`, the sidebar
order under category separators, and `content/docs/blocks/meta.json`, the blocks in catalog
order; `pnpm gen:docs --check` fails naming every missing page or a stale meta, and runs in
`pnpm build` and `pnpm run ci`.

The scaffold is short: frontmatter (`title`, `description` copied from the catalog, `item`),
`<InstallCommand item="…" />`, `<CopyPrompt item="…" />`, a placeholder comment where the
prose goes, an `## Examples` section with one `<DemoFrame item="…" demo="…" />` per demo in
the demo map, and `## Props` with `<PropsTable item="…" />`. Replace the placeholder with
one or two sentences on when to use the piece and what it pairs with (see
`speech-bubble.mdx`); Japanese samples go under `lang="ja"`. The pieces:

- `DemoFrame` renders the demo inline under Preview / Code tabs, with the source as it
  lands in a consumer project. Overlay items (`OVERLAY_ITEMS` in
  `components/docs/demo-frame.tsx`: the dialogs, sheets, drawers, popups and menus, sonner,
  sidebar, navigation-menu, combobox and command) render it as an iframe of the demo stage
  instead, so open popups never stack on the page.
- `PropsTable` is an `AutoTypeTable` over the item's exported props interface for a
  manga-native piece, and for a restyled primitive a link to shadcn's page plus the table of
  what mangacn adds (`lib/docs/props-delta.ts`: add a row there when you add a variant).
  The manga-native tables are generated: `pnpm gen:props` runs the TypeScript compiler over
  each props interface and writes `lib/docs/props.generated.json`, which the page, the `.md`
  route and the MCP all read (the MCP runs on Vercel, where the compiler cannot). A changed
  props interface or JSDoc: run `pnpm gen:props` and commit the result; `gen:props --check`
  (in `prebuild` and `pnpm run ci`) and `lib/docs/typescript.test.ts` fail when it is stale.
- `InstallCommand` and `CopyPrompt` read the catalog; nothing on the page is typed by hand
  except the prose.

`lib/docs/pages.test.ts` keeps pages and catalog in step: every item has a page, every page
names a catalog item, every demo in the map is framed or listed in the frontmatter's
`skipDemos` (`skipDemos: ["open"]`), and the placeholder is gone. The site suite
(`e2e/site.spec.ts`) screenshots and axe-checks a sample of pages, not every item page.

### Agent Skill

`skills/mangacn/` is the Agent Skill that teaches coding agents to use mangacn: `SKILL.md`
(the workflow and the three rules) and `references/` (design rules, install, Japanese,
composing pages, an `AGENTS.md` snippet). Agents install it with `npx skills add
fldx-dev/mangacn`; the MCP's `get_skill` serves the same files. `references/catalog.md` is
generated: `pnpm gen:skill` rewrites it from the catalog, and `pnpm gen:skill --check` (in
`pnpm run ci`, beside `gen:docs --check`) fails when it is stale. A new item or a changed
description: run `pnpm gen:skill` and commit the result. A changed design rule, install step
or default face: edit the matching reference file in the same PR. `pnpm skill:validate`
runs the Agent Skills validator (`skills-ref`, through `uvx`; install uv locally).
