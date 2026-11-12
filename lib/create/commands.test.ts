import { describe, expect, it } from "vitest";
import { PACKAGE_MANAGERS } from "@/lib/docs/package-managers";
import { encode } from "./code";
import { createCommands, PROJECT_NAME } from "./commands";
import { DEFAULT_CONFIG, PENS } from "./config";

describe("createCommands", () => {
  it("pins the four commands for the default code with npx", () => {
    expect(createCommands(DEFAULT_CONFIG)).toEqual({
      code: "10",
      bundleUrl: "https://www.mangacn.com/r/create/10.json",
      themeUrl: "https://www.mangacn.com/r/create/10/theme.json",
      nextProject:
        "npx shadcn@latest init -t next -b base -n my-manga-app -p https://www.mangacn.com/r/create/10.json --yes",
      viteProject:
        "npx shadcn@latest init -t vite -b base -n my-manga-app -p https://www.mangacn.com/r/create/10.json --yes",
      existingProject:
        "npx shadcn@latest add https://www.mangacn.com/r/create/10.json --yes --overwrite",
      lookOnly: "npx shadcn@latest add https://www.mangacn.com/r/create/10/theme.json --yes",
    });
  });

  it("uses each package manager's runner", () => {
    expect(PACKAGE_MANAGERS.map((m) => createCommands(DEFAULT_CONFIG, m).existingProject)).toEqual([
      "pnpm dlx shadcn@latest add https://www.mangacn.com/r/create/10.json --yes --overwrite",
      "npx shadcn@latest add https://www.mangacn.com/r/create/10.json --yes --overwrite",
      "yarn dlx shadcn@latest add https://www.mangacn.com/r/create/10.json --yes --overwrite",
      "bunx --bun shadcn@latest add https://www.mangacn.com/r/create/10.json --yes --overwrite",
    ]);
    expect(createCommands(DEFAULT_CONFIG, "pnpm").nextProject).toBe(
      "pnpm dlx shadcn@latest init -t next -b base -n my-manga-app -p https://www.mangacn.com/r/create/10.json --yes",
    );
  });

  it("carries the configuration's code and an origin it is given", () => {
    const config = {
      ...DEFAULT_CONFIG,
      look: { preset: "sepia" as const },
      pen: { ...PENS.brush },
    };
    const code = encode(config);
    const commands = createCommands(config, "pnpm", "http://127.0.0.1:4873");
    expect(commands.code).toBe(code);
    expect(commands.lookOnly).toBe(
      `pnpm dlx shadcn@latest add http://127.0.0.1:4873/r/create/${code}/theme.json --yes`,
    );
    expect(commands.viteProject).toContain(
      `-n ${PROJECT_NAME} -p http://127.0.0.1:4873/r/create/${code}.json`,
    );
  });

  it("never puts a character a shell would read specially into a line", () => {
    for (const manager of PACKAGE_MANAGERS) {
      const { code, ...lines } = createCommands(DEFAULT_CONFIG, manager);
      for (const line of Object.values(lines)) expect(line).toMatch(/^[\w ./:@-]+$/);
    }
  });
});
