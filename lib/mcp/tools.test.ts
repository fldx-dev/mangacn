// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { LoadedRegistry } from "@/lib/registry";
import { type SearchHit, searchText } from "./docs-tools";
import { createMcpServer, type McpDeps } from "./server";
import {
  type CatalogReaders,
  dependencyFiles,
  filesLine,
  HOOK_NOTE,
  installTarget,
  readCatalog,
  readSkill,
  SKILL_PLACEHOLDER,
} from "./tools";

// The seven tools, called through the SDK's HTTP handler as the route does: the four mangacn
// tools over the real catalog, the docs tools over stubs. The docs source is not importable from
// Vitest, so the page reads and search are stubbed; the e2e suite calls them for real against
// `next start`.

const catalog = readCatalog();

/** A stand-in for a docs page's Markdown: the title, the install line and a props heading. */
function stubPage(url: string): string | null {
  const name = url.split("/").pop() ?? "";
  if (!catalog.some((entry) => entry.page === url)) return null;
  return `# ${name}\n\nnpx shadcn@latest add @mangacn/${name}\n\n## Props\n`;
}

let skillDir: string;

function deps(
  read: Partial<CatalogReaders> = {},
  searchServer: { search: () => Promise<SearchHit[]> } = { search: async () => [] },
): McpDeps {
  return {
    source: { getPageByUrl: () => undefined } as unknown as McpDeps["source"],
    llms: {
      index: async () => "# mangacn",
      page: async () => "# page",
    } as unknown as McpDeps["llms"],
    searchServer: searchServer as unknown as McpDeps["searchServer"],
    read: {
      catalog: async () => catalog,
      pageMarkdown: async (url) => stubPage(url),
      skill: async (topic) => readSkill(topic, skillDir),
      ...read,
    },
  };
}

interface RpcResponse {
  result?: {
    tools?: { name: string; annotations?: { readOnlyHint?: boolean } }[];
    content?: { type: string; text: string }[];
    isError?: boolean;
  };
  error?: { code: number; message: string };
}

async function rpc(
  method: string,
  params: Record<string, unknown> = {},
  read?: Partial<CatalogReaders>,
  searchServer?: Parameters<typeof deps>[1],
): Promise<RpcResponse> {
  const handler = createMcpHandler(() => createMcpServer(deps(read, searchServer)));
  const response = await handler.fetch(
    new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "Mcp-Protocol-Version": "2025-06-18",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }),
  );
  const body = await response.text();
  const data = body
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6));
  return JSON.parse(data.at(-1) ?? body) as RpcResponse;
}

async function call(
  name: string,
  args: Record<string, unknown> = {},
  read?: Partial<CatalogReaders>,
  searchServer?: Parameters<typeof deps>[1],
) {
  const { result, error } = await rpc("tools/call", { name, arguments: args }, read, searchServer);
  if (error) throw new Error(error.message);
  return { text: result?.content?.[0]?.text ?? "", isError: result?.isError ?? false };
}

beforeAll(() => {
  skillDir = mkdtempSync(path.join(tmpdir(), "mangacn-skill-"));
});

afterAll(() => {
  rmSync(skillDir, { recursive: true, force: true });
});

describe("the MCP server", () => {
  it("answers initialize and lists the seven tools", async () => {
    const init = await rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test", version: "0" },
    });
    expect(init.error).toBeUndefined();

    const { result } = await rpc("tools/list");
    expect(result?.tools?.map((tool) => tool.name)).toEqual([
      "search",
      "list_pages",
      "get_page",
      "list_items",
      "get_item",
      "get_install_command",
      "get_skill",
    ]);
    for (const tool of result?.tools ?? []) {
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(true);
    }
  });
});

describe("search", () => {
  const hits: SearchHit[] = [
    { url: "/docs/theming", type: "page", content: "Theming", breadcrumbs: ["Guides"] },
    {
      url: "/docs/theming#dark-mode",
      type: "text",
      content: "Dark mode is the `.dark` class\non an ancestor.",
      breadcrumbs: ["Guides", "Theming", "Dark mode"],
    },
  ];

  it("answers in Markdown, one hit per line with its breadcrumb, text and URL", async () => {
    const { text, isError } = await call("search", { query: "dark" }, undefined, {
      search: async () => hits,
    });
    expect(isError).toBe(false);
    expect(text.split("\n").filter((line) => line.startsWith("- "))).toEqual([
      "- Guides · Theming · https://www.mangacn.com/docs/theming",
      "- Guides › Theming › Dark mode · Dark mode is the `.dark` class on an ancestor. · https://www.mangacn.com/docs/theming#dark-mode",
    ]);
    expect(text).toMatch(/^2 docs hit\(s\) for "dark"/);
  });

  it("says so when nothing matches, and cuts a long text", () => {
    expect(searchText("zzz", [])).toBe(
      'No docs match "zzz". list_pages lists every page; list_items every item.\n',
    );
    const long = searchText("x", [{ url: "/docs", type: "text", content: "a ".repeat(300) }]);
    const line = long.split("\n").find((entry) => entry.startsWith("- ")) ?? "";
    expect(line).toContain("…");
    expect(line.length).toBeLessThan(300);
  });
});

describe("list_items", () => {
  it("lists every item, one line each, in category order", async () => {
    const { text, isError } = await call("list_items");
    expect(isError).toBe(false);
    const lines = text.split("\n").filter((line) => line.startsWith("- "));
    expect(lines).toHaveLength(catalog.length);
    expect(lines[0]).toMatch(/^- button · registry:ui · primitive: /);
    expect(text).toContain(
      "- speech-bubble · registry:component · text: Dialogue bubble with a hand-drawn tail",
    );
    expect(text).toContain(
      "Install: `pnpm dlx shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble --overwrite`. Docs: https://www.mangacn.com/docs/components/speech-bubble",
    );
    expect(text).toContain("Needs: cn, class-variance-authority.");
    // Whether it is a client component, from its file's directive; nothing for the theme.
    const line = (name: string) => text.split("\n").find((entry) => entry.startsWith(`- ${name} `));
    const bubble = catalog.find((entry) => entry.name === "speech-bubble");
    expect(line("speech-bubble")).toContain(
      bubble?.client ? " Client component. Install:" : " Server component. Install:",
    );
    expect(line("theme")).not.toMatch(/(Client|Server) component/);
    // A theme preset (Task 99) is listed like the theme: its own add, both flags, the guide.
    expect(line("theme-sepia")).toMatch(/^- theme-sepia · registry:theme · decoration: /);
    expect(line("theme-sepia")).toContain(
      "Install: `pnpm dlx shadcn@latest add @mangacn/theme-sepia --yes --overwrite`. Docs: https://www.mangacn.com/docs/theming",
    );
  });

  it("filters by category", async () => {
    const { text } = await call("list_items", { category: "background" });
    const names = text
      .split("\n")
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2).split(" ")[0]);
    expect(names).toEqual(["speed-lines", "focus-lines", "halftone-background"]);
    expect(text).toContain('3 items in "background"');
  });

  it("lists the blocks last, under the category block", async () => {
    const { text } = await call("list_items", { category: "block" });
    expect(text).toContain(
      "- chapter-list · registry:block · block: Chapter index for a series: one item row per chapter",
    );
    expect(text).toContain(
      "Server component. Install: `pnpm dlx shadcn@latest add @mangacn/chapter-list --overwrite`. Docs: https://www.mangacn.com/docs/blocks/chapter-list",
    );
    expect(catalog.findLastIndex((entry) => entry.category === "block")).toBe(
      catalog.findIndex((entry) => entry.category === "hook") - 1,
    );
  });

  it("lists the hooks after the blocks, as hooks rather than client or server components", async () => {
    const { text } = await call("list_items", { category: "hook" });
    expect(text).toContain('1 items in "hook"');
    expect(text).toContain(
      `- use-mobile · registry:hook · hook: Stock hook useIsMobile: true below 768 px, following the viewport; sidebar reads it to become a sheet on phones. ${HOOK_NOTE} Install: \`pnpm dlx shadcn@latest add @mangacn/use-mobile --overwrite\`. Docs: https://www.mangacn.com/r/use-mobile.json`,
    );
    expect(text).not.toMatch(/(Client|Server) component/);
    expect(catalog.at(-1)?.category).toBe("hook");
  });

  it("rejects a category outside the catalog", async () => {
    const { isError } = await call("list_items", { category: "widgets" });
    expect(isError).toBe(true);
  });
});

describe("get_item", () => {
  it("returns the item's page Markdown and its install targets", async () => {
    const { text, isError } = await call("get_item", { name: "speech-bubble" });
    expect(isError).toBe(false);
    expect(text).toContain("npx shadcn@latest add @mangacn/speech-bubble");
    expect(text).toContain("## Props");
    expect(text).toMatch(
      /\n\nFiles: components\/speech-bubble\.tsx; also adds components\/ink-frame\.tsx through its registry dependencies \(/,
    );
  });

  it("names the files its registry dependencies add, transitively and once each", async () => {
    const { text } = await call("get_item", { name: "power-gauge" });
    expect(text).toContain(
      "Files: components/power-gauge.tsx, components/power-gauge-burst.tsx; also adds components/ink-frame.tsx, components/sfx-text.tsx through its registry dependencies (where `shadcn add` writes them with the default components.json aliases).",
    );
    const dialog = catalog.find((entry) => entry.name === "dialog");
    expect(dialog?.dependencyFiles).toEqual([
      "components/ui/button.tsx",
      "components/ink-frame.tsx",
    ]);
    const inkFrame = catalog.find((entry) => entry.name === "ink-frame");
    expect(inkFrame?.dependencyFiles).toEqual([]);
  });

  it("returns a block's page with a Files line naming every block file", async () => {
    const entry = catalog.find((item) => item.name === "chapter-list");
    expect(entry?.page).toBe("/docs/blocks/chapter-list");
    const { text, isError } = await call("get_item", { name: "chapter-list" });
    expect(isError).toBe(false);
    expect(text).toContain("npx shadcn@latest add @mangacn/chapter-list");
    expect(text).toContain(
      "Files: components/blocks/chapter-list/chapter-list.tsx, components/blocks/chapter-list/chapter-numeral.ts; also adds components/caption-box.tsx, components/ink-frame.tsx, components/ink-mark.tsx, components/stamp.tsx, components/ui/separator.tsx, components/ui/item.tsx through its registry dependencies",
    );
  });

  it("places primitives under components/ui and accepts the @mangacn/ form", async () => {
    const { text } = await call("get_item", { name: "@mangacn/Button" });
    expect(text).toContain("# button");
    expect(text).toContain("Files: components/ui/button.tsx");
  });

  it("summarises an item with no page of its own", async () => {
    const { text, isError } = await call("get_item", { name: "font-display" });
    expect(isError).toBe(false);
    expect(text).toContain("# Dela Gothic One");
    expect(text).toContain("pnpm dlx shadcn@latest add @mangacn/font-display");
    expect(text).toContain("https://www.mangacn.com/docs/theming covers it");
    expect(text).toContain("Files: none;");
  });

  it("summarises a hook: no page, its install target, the hook line", async () => {
    const entry = catalog.find((item) => item.name === "use-mobile");
    expect(entry).toMatchObject({ type: "registry:hook", page: null, client: null });
    const { text, isError } = await call("get_item", { name: "use-mobile" });
    expect(isError).toBe(false);
    expect(text).toContain("# Use Mobile");
    expect(text).toContain("A hook has no docs page of its own");
    expect(text).toContain(HOOK_NOTE);
    expect(text).toContain(
      "Files: hooks/use-mobile.ts (where `shadcn add` writes them with the default components.json aliases).",
    );
  });

  it("names a declared hook's hooks/<name>.ts in the Files line of the item that declares it", () => {
    const fixture: LoadedRegistry = {
      name: "fixture",
      homepage: "",
      items: [
        {
          name: "use-mobile",
          type: "registry:hook",
          source: "registry/hooks/registry.json",
          files: [
            {
              path: "registry/hooks/use-mobile.ts",
              type: "registry:hook",
              target: "@hooks/use-mobile.ts",
            },
          ],
        },
        {
          name: "rail",
          type: "registry:ui",
          source: "registry/ui/registry.json",
          registryDependencies: [
            "https://www.mangacn.com/r/use-mobile.json",
            "https://www.mangacn.com/r/ink-frame.json",
          ],
          files: [
            { path: "registry/ui/rail/rail.tsx", type: "registry:ui", target: "@ui/rail.tsx" },
          ],
        },
        {
          name: "ink-frame",
          type: "registry:component",
          source: "registry/theme/registry.json",
          files: [
            {
              path: "registry/theme/ink-frame/ink-frame.tsx",
              type: "registry:component",
              target: "@components/ink-frame.tsx",
            },
          ],
        },
      ],
    };
    const deps = dependencyFiles("rail", fixture);
    expect(deps).toEqual(["hooks/use-mobile.ts", "components/ink-frame.tsx"]);
    expect(filesLine({ files: ["components/ui/rail.tsx"], dependencyFiles: deps })).toBe(
      "Files: components/ui/rail.tsx; also adds hooks/use-mobile.ts, components/ink-frame.tsx through its registry dependencies (where `shadcn add` writes them with the default components.json aliases).",
    );
  });

  it("words the Files line for every mix of own and dependency files", () => {
    const note = "(where `shadcn add` writes them with the default components.json aliases)";
    expect(filesLine({ files: ["components/stamp.tsx"], dependencyFiles: [] })).toBe(
      `Files: components/stamp.tsx ${note}.`,
    );
    expect(filesLine({ files: [], dependencyFiles: ["components/ink-frame.tsx"] })).toBe(
      `Files: none of its own; adds components/ink-frame.tsx through its registry dependencies ${note}.`,
    );
    expect(filesLine({ files: [], dependencyFiles: [] })).toBe(
      "Files: none; the item writes into your globals.css and root layout instead.",
    );
  });

  it("is an error naming the nearest items for an unknown name", async () => {
    const { text, isError } = await call("get_item", { name: "speach-bubble" });
    expect(isError).toBe(true);
    expect(text).toContain('Unknown mangacn item "speach-bubble"');
    // `bubble` is inside the typo, so it ranks with the closest spelling.
    expect(text).toMatch(/Nearest names: bubble, speech-bubble, /);
  });
});

describe("get_install_command", () => {
  const set = "@mangacn/ink-frame @mangacn/speech-bubble @mangacn/button --overwrite";

  it.each([
    [undefined, `npx shadcn@latest add ${set}`],
    ["npm", `npx shadcn@latest add ${set}`],
    ["pnpm", `pnpm dlx shadcn@latest add ${set}`],
    ["yarn", `yarn dlx shadcn@latest add ${set}`],
    ["bun", `bunx --bun shadcn@latest add ${set}`],
  ])("returns one add for two items with %s", async (manager, line) => {
    const { text, isError } = await call("get_install_command", {
      names: ["speech-bubble", "button"],
      ...(manager ? { manager } : {}),
    });
    expect(isError).toBe(false);
    const lines = text.trimEnd().split("\n");
    expect(lines.at(-1)).toBe(line);
    expect(text).toContain('"registries": { "@mangacn": "https://www.mangacn.com/r/{name}.json" }');
    expect(text.indexOf('"registries"')).toBeLessThan(text.indexOf(line));
  });

  it("puts the theme and its fonts first", async () => {
    const { text } = await call("get_install_command", { names: ["speech-bubble", "theme"] });
    expect(text.trimEnd().split("\n").at(-1)).toBe(
      "npx shadcn@latest add @mangacn/theme @mangacn/ink-frame @mangacn/speech-bubble --yes --overwrite",
    );
    expect(text).toContain(`--yes answers the theme's "You are about to install a new theme`);
  });

  it("explains --overwrite alone for a set without the theme", async () => {
    const { text } = await call("get_install_command", { names: ["button"] });
    expect(text).toContain("Keep the flag: --overwrite answers");
    expect(text).not.toContain("--yes");
  });

  it("is an error for an unknown name", async () => {
    const { text, isError } = await call("get_install_command", {
      names: ["speech-bubble", "stat-card"],
    });
    expect(isError).toBe(true);
    expect(text).toContain('Unknown mangacn item "stat-card"');
  });
});

describe("get_skill", () => {
  it("returns the placeholder while the skill folder is missing", async () => {
    const { text, isError } = await call(
      "get_skill",
      {},
      {
        skill: async (topic) => readSkill(topic, path.join(skillDir, "missing")),
      },
    );
    expect(isError).toBe(false);
    expect(text).toBe(SKILL_PLACEHOLDER);
  });

  it("returns SKILL.md and a reference by topic", async () => {
    writeFileSync(path.join(skillDir, "SKILL.md"), "---\nname: mangacn\n---\n\n# mangacn\n");
    mkdirSync(path.join(skillDir, "references"), { recursive: true });
    writeFileSync(path.join(skillDir, "references", "design-rules.md"), "# Design rules\n");

    expect((await call("get_skill")).text).toBe("---\nname: mangacn\n---\n\n# mangacn\n");
    expect((await call("get_skill", { topic: "design-rules" })).text).toBe("# Design rules\n");
    expect((await call("get_skill", { topic: "design-rules.md" })).text).toBe("# Design rules\n");
    expect((await call("get_skill", { topic: "japanese" })).text).toBe(
      'No reference "japanese" in the mangacn skill; topics: design-rules.',
    );
  });

  it("refuses a topic that is not a file name", async () => {
    const { isError } = await call("get_skill", { topic: "../SKILL" });
    expect(isError).toBe(true);
  });
});

describe("installTarget", () => {
  it("maps aliases and falls back to the type's folder", () => {
    expect(
      installTarget({ path: "x/button.tsx", type: "registry:ui", target: "@ui/button.tsx" }),
    ).toBe("components/ui/button.tsx");
    expect(installTarget({ path: "manga-motion/manga-motion.ts", type: "registry:lib" })).toBe(
      "lib/manga-motion.ts",
    );
    expect(catalog.find((entry) => entry.name === "manga-motion")?.files).toEqual([
      "lib/manga-motion.ts",
    ]);
  });

  it("puts a hook in hooks/, by its @hooks target or by its type", () => {
    const file = { path: "registry/hooks/use-mobile.ts", type: "registry:hook" };
    expect(installTarget({ ...file, target: "@hooks/use-mobile.ts" })).toBe("hooks/use-mobile.ts");
    expect(installTarget(file)).toBe("hooks/use-mobile.ts");
  });
});
