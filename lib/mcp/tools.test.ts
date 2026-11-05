// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createMcpServer, type McpDeps } from "./server";
import {
  type CatalogReaders,
  installTarget,
  readCatalog,
  readSkill,
  SKILL_PLACEHOLDER,
} from "./tools";

// The four mangacn tools over the real catalog, called through the SDK's HTTP handler as the
// route does. The docs source is not importable from Vitest, so the page reads are stubbed; the
// e2e suite calls them for real against `next start`.

const catalog = readCatalog();

/** A stand-in for a docs page's Markdown: the title, the install line and a props heading. */
function stubPage(url: string): string | null {
  const name = url.split("/").pop() ?? "";
  if (!catalog.some((entry) => entry.page === url)) return null;
  return `# ${name}\n\nnpx shadcn@latest add @mangacn/${name}\n\n## Props\n`;
}

let skillDir: string;

function deps(read: Partial<CatalogReaders> = {}): McpDeps {
  return {
    source: { getPageByUrl: () => undefined } as unknown as McpDeps["source"],
    llms: {
      index: async () => "# mangacn",
      page: async () => "# page",
    } as unknown as McpDeps["llms"],
    searchServer: { search: async () => [] } as unknown as McpDeps["searchServer"],
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
    tools?: { name: string }[];
    content?: { type: string; text: string }[];
    isError?: boolean;
  };
  error?: { code: number; message: string };
}

async function rpc(
  method: string,
  params: Record<string, unknown> = {},
  read?: Partial<CatalogReaders>,
): Promise<RpcResponse> {
  const handler = createMcpHandler(() => createMcpServer(deps(read)));
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
) {
  const { result, error } = await rpc("tools/call", { name, arguments: args }, read);
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
      "Install: `pnpm dlx shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble`. Docs: https://www.mangacn.com/docs/components/speech-bubble",
    );
    expect(text).toContain("Needs: cn, class-variance-authority.");
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
    expect(text).toMatch(/\n\nFiles: components\/speech-bubble\.tsx \(/);
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

  it("is an error naming the nearest items for an unknown name", async () => {
    const { text, isError } = await call("get_item", { name: "speach-bubble" });
    expect(isError).toBe(true);
    expect(text).toContain('Unknown mangacn item "speach-bubble"');
    expect(text).toMatch(/Nearest names: speech-bubble, /);
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
      "npx shadcn@latest add @mangacn/theme @mangacn/font-display @mangacn/font-dialogue @mangacn/font-dialogue-ja @mangacn/ink-frame @mangacn/speech-bubble --overwrite",
    );
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
});
