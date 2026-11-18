// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pageFile } from "../lib/registry/blocks";
import { loadRegistry } from "../lib/registry/index";
import { rewriteBuiltPage } from "./registry-rewrite-pages";

// The post-build step of `pnpm registry:build`: a page's own-component imports at their install
// paths in the emitted JSON, nothing else touched, written as `shadcn build` writes it.

const loginPage = {
  path: "registry/blocks/login-01/page.tsx",
  type: "registry:page",
  target: "app/login/page.tsx",
};
const loginForm = {
  path: "registry/blocks/login-01/components/login-form.tsx",
  type: "registry:component",
  target: "@components/login-form.tsx",
};
const item = { name: "login-01", type: "registry:block", files: [loginPage, loginForm] };
const built = (page: string, form = 'import { cn } from "cn";\n') =>
  JSON.stringify(
    {
      name: "login-01",
      files: [
        { ...loginPage, content: page },
        { ...loginForm, content: form },
      ],
    },
    null,
    2,
  );

describe("rewriteBuiltPage", () => {
  it("rewrites the page's ./components/<file> import and nothing else", () => {
    const form = 'import { Field } from "./field";\n';
    expect(
      rewriteBuiltPage(built('import { LoginForm } from "./components/login-form";\n', form), item),
    ).toBe(built('import { LoginForm } from "@/components/login-form";\n', form));
  });

  it("returns null when the page already imports by install path, or for a non-page block", () => {
    expect(
      rewriteBuiltPage(built('import { LoginForm } from "@/components/login-form";\n'), item),
    ).toBeNull();
    expect(
      rewriteBuiltPage(built("export {};\n"), {
        name: "chapter-list",
        type: "registry:block",
        files: [{ path: "registry/blocks/chapter-list/chapter-list.tsx", type: "registry:block" }],
      }),
    ).toBeNull();
  });

  it("turns each shipped page's relative own imports into install paths only", () => {
    const registry = loadRegistry();
    for (const name of ["login-01", "signup-01", "sidebar-07"]) {
      const block = registry.items.find((entry) => entry.name === name);
      const page = block && pageFile(block);
      if (!block || !page) throw new Error(`${name} is not a page block`);
      const source = readFileSync(page.path, "utf8");
      const json = JSON.stringify({ name, files: [{ ...page, content: source }] }, null, 2);
      const out = JSON.parse(rewriteBuiltPage(json, block) ?? "{}") as {
        files?: { content: string }[];
      };
      const content = out.files?.[0].content ?? "";
      expect(content, name).not.toMatch(/from "\.\/components\//);
      expect(content.replaceAll('"@/components/', '"./components/'), name).toBe(
        source.replaceAll('"@/components/', '"./components/'),
      );
    }
  });
});
