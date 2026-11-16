/**
 * A Create configuration in words (Task C6): the lines `/create.md` prints for it, the summary the
 * agent prompt opens with, and the prompt itself. Every word comes from the configuration's
 * validated numbers and names and this module's fixed labels, never from a URL. No Node imports:
 * the Get code dialog builds the prompt in the browser.
 */

import type { PackageManager } from "@/lib/docs/package-managers";
import { createCommands } from "./commands";
import {
  type CreateConfig,
  type DialogueFont,
  type DisplayFont,
  type LookPreset,
  PEN_RANGES,
  PEN_TOKENS,
  penName,
  type Range,
  SCREENTONE_RANGES,
  SCREENTONE_TOKENS,
} from "./config";
import type { Framework } from "./files";
import { type KitName, kitItems } from "./kits";
import { CREATE_PAGE_URL, SITE_ORIGIN } from "./urls";

export const LOOK_NAMES: Record<LookPreset, string> = {
  default: "Default",
  sepia: "Sepia",
  weekly: "Weekly",
  blueline: "Blueline",
};

export const KIT_TITLES: Record<KitName, string> = {
  basics: "Basics",
  reader: "Reader",
  "app-shell": "App shell",
  chat: "Chat",
  "series-site": "Series site",
};

export const FONT_NAMES: Record<DisplayFont | DialogueFont, string> = {
  "dela-gothic-one": "Dela Gothic One",
  "reggae-one": "Reggae One",
  "shantell-sans": "Shantell Sans",
  "patrick-hand-sc": "Patrick Hand SC",
};

export const FRAMEWORK_NAMES: Record<Framework, string> = { next: "Next.js", vite: "Vite" };

/** The Create page with a code: `https://www.mangacn.com/create?c=111`. */
export function createPageUrl(code: string): string {
  return `${CREATE_PAGE_URL}?c=${code}`;
}

/** `/create.md` for a code: `https://www.mangacn.com/create.md?c=111`. */
export function createMarkdownUrl(code: string): string {
  return `${SITE_ORIGIN}/create.md?c=${code}`;
}

function value(n: number, range: Range): string {
  return `${n}${range.unit}`;
}

/** The look as words: `Sepia`, or `Custom: paper hue 40 strength 3, …`. */
export function lookText(look: CreateConfig["look"]): string {
  if ("preset" in look) return LOOK_NAMES[look.preset];
  const { paper, ink, spot } = look.custom;
  return (
    `Custom (paper hue ${paper.hue} strength ${paper.strength}, ` +
    `ink hue ${ink.hue} strength ${ink.strength}, spot hue ${spot.hue} vividness ${spot.vividness})`
  );
}

/** The kit as words: `Basics (ink-frame, speech-bubble, button)`. */
export function kitText(kit: CreateConfig["kit"]): string {
  const items = kitItems(kit).join(", ");
  return "preset" in kit ? `${KIT_TITLES[kit.preset]} (${items})` : `Hand-picked (${items})`;
}

/** One line per choice, as `/create.md` lists them. */
export function configLines(config: CreateConfig): [label: string, text: string][] {
  const pen = penName(config.pen);
  const penValues = PEN_TOKENS.map((t) => `${t} ${value(config.pen[t], PEN_RANGES[t])}`);
  return [
    ["Look", lookText(config.look)],
    [
      "Pen",
      `${pen ? `${pen[0].toUpperCase()}${pen.slice(1)}` : "Custom"} (${penValues.join(", ")})`,
    ],
    [
      "Screentone",
      SCREENTONE_TOKENS.map(
        (t) => `${t} ${value(config.screentone[t], SCREENTONE_RANGES[t])}`,
      ).join(", "),
    ],
    [
      "Fonts",
      `display ${FONT_NAMES[config.fonts.display]}, dialogue ${FONT_NAMES[config.fonts.dialogue]}`,
    ],
    ["Kit", kitText(config.kit)],
  ];
}

/** A short summary: `the Sepia look, the brush pen and the Basics kit`. */
export function configSummary(config: CreateConfig): string {
  const look =
    "preset" in config.look ? `the ${LOOK_NAMES[config.look.preset]} look` : "a custom look";
  const pen = penName(config.pen);
  const kit =
    "preset" in config.kit
      ? `the ${KIT_TITLES[config.kit.preset]} kit`
      : `a kit of ${kitItems(config.kit).length} hand-picked items`;
  return `${look}, ${pen ? `the ${pen} pen` : "a custom pen"} and ${kit}`;
}

export interface PromptOptions {
  manager?: PackageManager;
  framework?: Framework;
}

/**
 * The prompt for a coding agent: the code, the command for a new project and for an existing one,
 * where to read what the code installs, and the mangacn docs MCP and Agent Skill.
 */
export function agentPrompt(
  config: CreateConfig,
  { manager = "npm", framework = "next" }: PromptOptions = {},
): string {
  const commands = createCommands(config, manager);
  const newProject = framework === "vite" ? commands.viteProject : commands.nextProject;
  return [
    `Set up mangacn (hand-drawn manga components for shadcn/ui) with Create code ${commands.code}: ${configSummary(config)}.`,
    "",
    `- For a new ${FRAMEWORK_NAMES[framework]} project, run: ${newProject}`,
    `- In a project that already uses shadcn, run: ${commands.existingProject}`,
    "  It replaces the theme and overwrites any kit file that is already there, so check edited files first.",
    `- What the code installs, file by file: ${createMarkdownUrl(commands.code)}`,
    `- Read the components' props and demos through the mangacn docs MCP (${SITE_ORIGIN}/api/mcp), and follow the mangacn Agent Skill (npx skills add fldx-dev/mangacn) for the design rules.`,
    `- To change the look, make a new code at ${createPageUrl(commands.code)} rather than editing the theme's variables by hand.`,
  ].join("\n");
}
