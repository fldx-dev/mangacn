/**
 * `/create.md?c=<code>` (Task C6): the Create page as text for agents. The configuration decoded,
 * the commands, and the files each install writes. A code `decode` rejects gives the default
 * configuration with a note; the note holds `decode`'s reason (numbers and fixed words), never
 * the request's text, and every other line is built from the decoded configuration.
 */

import { decodeOrDefault } from "./code";
import { createCommands } from "./commands";
import {
  agentPrompt,
  configLines,
  createMarkdownUrl,
  createPageUrl,
  FRAMEWORK_NAMES,
} from "./describe";
import { type Framework, type InstalledItem, installPlan } from "./files";
import { CREATE_PAGE_URL } from "./urls";

function fence(line: string): string {
  return ["```bash", line, "```"].join("\n");
}

function itemLines(items: InstalledItem[]): string[] {
  return items.map((item) => {
    const files = item.files.map((file) => `\`${file}\``).join(", ") || "no file";
    const skipped = item.skipped.length
      ? `; skipped: ${item.skipped.map((file) => `\`${file}\``).join(", ")}`
      : "";
    return `- ${item.name}: ${files}${skipped}`;
  });
}

function filesSection(config: Parameters<typeof installPlan>[0], framework: Framework): string[] {
  const plan = installPlan(config, framework);
  const fontLine =
    framework === "vite"
      ? `- \`${plan.fontFile}\`: imports ${plan.fonts.join(", ")} from Fontsource`
      : `- \`${plan.fontFile}\`: loads ${plan.fonts.join(", ")} with \`next/font/google\``;
  return [
    `### ${FRAMEWORK_NAMES[framework]}`,
    "",
    "Theme and fonts:",
    "",
    `- \`${plan.stylesheet}\`: the look, the pen and the screentone as CSS variables, with the theme's utilities and keyframes`,
    fontLine,
    "",
    "The kit:",
    "",
    ...itemLines(plan.kit),
    ...(plan.brought.length ? ["", "Brought by the kit:", "", ...itemLines(plan.brought)] : []),
    "",
    `Packages: ${plan.packages.length ? plan.packages.map((name) => `\`${name}\``).join(", ") : "none"}`,
  ];
}

/** The text `/create.md` answers for the raw `c` parameter (or its absence). */
export function createMarkdown(raw: string | null): string {
  const { config, reason } = decodeOrDefault(raw ?? undefined);
  const commands = createCommands(config);
  const note =
    raw === null
      ? `No code was given, so this is the default configuration. Add \`?c=<code>\` for another; make one at ${CREATE_PAGE_URL}.`
      : reason
        ? `This code was not used (${reason}), so this is the default configuration.`
        : null;
  return [
    `# mangacn Create: code ${commands.code}`,
    "> A mangacn theme and starter kit for shadcn/ui, made on the Create page and installed with one shadcn command.",
    `URL: ${createPageUrl(commands.code)}`,
    `Markdown: ${createMarkdownUrl(commands.code)}`,
    ...(note ? [note] : []),
    "## Configuration",
    configLines(config)
      .map(([label, text]) => `- ${label}: ${text}`)
      .join("\n"),
    "## Commands",
    "With pnpm, yarn or bun, replace `npx` with `pnpm dlx`, `yarn dlx` or `bunx --bun`. The project folder after `-n` can be renamed.",
    ["### A new Next.js project", "", fence(commands.nextProject)].join("\n"),
    [
      "### A new Vite project",
      "",
      fence(commands.viteProject),
      "",
      "Vite skips the kit's page files, and the fonts come from Fontsource packages.",
    ].join("\n"),
    [
      "### A project that already uses shadcn",
      "",
      fence(commands.existingProject),
      "",
      "It replaces the theme and overwrites any kit file that is already there, edited or not.",
    ].join("\n"),
    [
      "### The look only",
      "",
      fence(commands.lookOnly),
      "",
      "The theme and its fonts, no component.",
    ].join("\n"),
    "## Files",
    filesSection(config, "next").join("\n"),
    filesSection(config, "vite").join("\n"),
    "## Prompt for an agent",
    ["```text", agentPrompt(config), "```"].join("\n"),
  ]
    .join("\n\n")
    .concat("\n");
}
