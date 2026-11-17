/**
 * Regression (MANGA-11, found in the C8 proof run): `add <code>.json` and `add <code>/theme.json`
 * in an existing Vite project rewrote its `--font-sans: '<own font>', sans-serif` to
 * `--font-sans: var(--font-sans);`, a variable that refers to itself, so `body` fell back to Times
 * New Roman. `shadcn add` writes the `cssVars` of every item it installs, a `registry:base`
 * bundle's own included (measured, shadcn 4.23). So no item the existing-project or look-only
 * command installs may set `font-sans` or `font-heading`; only the bundles a new project starts
 * from (`init -p`) may.
 */

import { describe, expect, it } from "vitest";
import { createCommands } from "./commands";
import {
  type CreateConfig,
  DEFAULT_CONFIG,
  type DialogueFont,
  type DisplayFont,
  LOOK_PRESETS,
} from "./config";
import { DIALOGUE_FACES, DISPLAY_FACES } from "./fonts";
import { FONT_MAPPINGS, VITE_FONT_SANS } from "./items";
import { KITS } from "./kits";
import { type CreateItemKind, createAnswer } from "./serve";
import { SITE_ORIGIN } from "./urls";

type Vars = Record<string, string>;
interface Item {
  name: string;
  cssVars?: { theme?: Vars; light?: Vars; dark?: Vars };
}

const FONT_VARS = ["font-sans", "font-heading"] as const;

/** Every look with every face pair, and every kit. */
const CONFIGS: CreateConfig[] = [
  ...LOOK_PRESETS.flatMap((look) =>
    (Object.keys(DISPLAY_FACES) as DisplayFont[]).flatMap((display) =>
      (Object.keys(DIALOGUE_FACES) as DialogueFont[]).map((dialogue) => ({
        ...DEFAULT_CONFIG,
        look: { preset: look },
        fonts: { display, dialogue },
      })),
    ),
  ),
  ...(Object.keys(KITS) as (keyof typeof KITS)[]).map((kit) => ({
    ...DEFAULT_CONFIG,
    kit: { preset: kit },
  })),
];

/** The item a printed command installs, answered as `app/r/create/` answers its URL. */
function itemOf(command: string): Item {
  const url = command.split(" ").find((word) => word.startsWith(`${SITE_ORIGIN}/r/create/`));
  if (!url) throw new Error(`no Create URL in: ${command}`);
  const rest = url.slice(`${SITE_ORIGIN}/r/create/`.length);
  const nested = /^([^/]+)\/(theme|next|vite)\.json$/.exec(rest);
  const [kind, segment]: [CreateItemKind, string] = nested
    ? [nested[2] as CreateItemKind, nested[1]]
    : ["bundle", rest];
  const answer = createAnswer(kind, segment, SITE_ORIGIN);
  expect(answer.status).toBe(200);
  return answer.body as Item;
}

/** Each font variable an item writes, in any of its `cssVars` blocks. */
function fontVars(item: Item): Vars {
  const found: Vars = {};
  for (const block of Object.values(item.cssVars ?? {})) {
    for (const name of FONT_VARS) if (block?.[name] !== undefined) found[name] = block[name];
  }
  return found;
}

describe("an existing project keeps its own body font (MANGA-11)", () => {
  it.each(CONFIGS.map((c) => [createCommands(c).code, c] as const))(
    "%s: the existing-project and look-only items set neither font-sans nor font-heading",
    (_code, config) => {
      const commands = createCommands(config);
      for (const command of [commands.existingProject, commands.lookOnly]) {
        const item = itemOf(command);
        const vars = fontVars(item);
        // The self-referencing values that broke the body font, named for a clear failure …
        expect(vars["font-sans"]).not.toBe("var(--font-sans)");
        expect(vars["font-heading"]).not.toBe("var(--font-heading)");
        expect(vars["font-heading"]).not.toBe("var(--font-sans)");
        // … and nothing else either: the project's own value must survive.
        expect(vars, `${item.name} (${command})`).toEqual({});
      }
    },
  );

  it.each(CONFIGS.map((c) => [createCommands(c).code, c] as const))(
    "%s: a new project's bundle still maps the body font",
    (_code, config) => {
      const commands = createCommands(config);
      expect(fontVars(itemOf(commands.nextProject))).toEqual(FONT_MAPPINGS);
      expect(fontVars(itemOf(commands.viteProject))).toEqual({
        ...FONT_MAPPINGS,
        "font-sans": VITE_FONT_SANS,
      });
    },
  );
});
