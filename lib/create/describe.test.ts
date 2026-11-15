import { describe, expect, it } from "vitest";
import { decode } from "./code";
import { createCommands } from "./commands";
import { DEFAULT_CONFIG } from "./config";
import { agentPrompt, configLines, configSummary } from "./describe";

function config(code: string) {
  const result = decode(code);
  if (!result.ok) throw new Error(result.reason);
  return result.config;
}

describe("configLines", () => {
  it("names every choice of the default code", () => {
    expect(configLines(DEFAULT_CONFIG)).toEqual([
      ["Look", "Default"],
      [
        "Pen",
        "Default (outline-width 1.5px, outline-width-heavy 2.1px, ink-roughness 1.2, ink-bowing 0.8, ink-offset 1.5, ink-hachure-gap 4px)",
      ],
      ["Screentone", "halftone-size 4px, halftone-dot 1.2px, speed-line-width 2px"],
      ["Fonts", "display Dela Gothic One, dialogue Shantell Sans"],
      ["Kit", "Basics (ink-frame, speech-bubble, button)"],
    ]);
  });

  it("spells out a custom look", () => {
    const [look] = configLines(config("1J4blt1gX22"));
    expect(look[1]).toMatch(
      /^Custom \(paper hue \d+ strength \d+, ink hue \d+ strength \d+, spot hue \d+ vividness \d+\)$/,
    );
  });
});

describe("agentPrompt", () => {
  it.each(["10", "1H11", "1J4blt1gX22"])(
    "names code %s, both commands, the Markdown, the docs MCP and the skill",
    (code) => {
      const c = config(code);
      const commands = createCommands(c, "pnpm");
      const prompt = agentPrompt(c, { manager: "pnpm", framework: "vite" });
      expect(prompt).toContain(`Create code ${commands.code}: ${configSummary(c)}.`);
      expect(prompt).toContain(`run: ${commands.viteProject}\n`);
      expect(prompt).toContain(`run: ${commands.existingProject}\n`);
      expect(prompt).toContain(`https://www.mangacn.com/create.md?c=${commands.code}`);
      expect(prompt).toContain("https://www.mangacn.com/api/mcp");
      expect(prompt).toContain("npx skills add fldx-dev/mangacn");
    },
  );

  it("defaults to npm and Next.js", () => {
    expect(agentPrompt(DEFAULT_CONFIG)).toContain(
      "run: npx shadcn@latest init -t next -b base -n my-manga-app -p https://www.mangacn.com/r/create/10.json --yes",
    );
  });
});
