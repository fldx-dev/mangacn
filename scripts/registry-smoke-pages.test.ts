// @vitest-environment node
import { describe, expect, it } from "vitest";
import { loadRegistry } from "../lib/registry/index";
import { installFamilies } from "./registry-smoke";
import {
  DEMO_EXCEPTIONS,
  installDemoSource,
  installPaths,
  readRepoFile,
  smokeEntries,
  smokePageFiles,
  variantCopies,
} from "./registry-smoke-pages";

// The smoke's prerendered pages without installing anything: every item is rendered or listed
// with its reason, and every demo's repo imports resolve to install paths.

const registry = loadRegistry();
const names = registry.items.map((item) => item.name);
const variants = new Set(installFamilies(registry.items).flat());

describe("smokeEntries", () => {
  it("renders every catalog item's default demo or lists it with a reason", () => {
    const { entries, skipped } = smokeEntries(registry.items, names, names, variants, readRepoFile);
    const covered = [...entries.map((entry) => entry.name), ...skipped.map((skip) => skip.name)];
    expect(covered.sort()).toEqual([...names].sort());
    for (const entry of entries) expect(entry.source).not.toMatch(/["']@\/registry\//);
    for (const skip of skipped) expect(skip.reason).not.toBe("");
  });

  it("lists only catalog items as exceptions", () => {
    for (const name of Object.keys(DEMO_EXCEPTIONS)) expect(names).toContain(name);
  });

  it("renders only the requested items, resolving against everything installed", () => {
    const { entries } = smokeEntries(
      registry.items,
      ["ink-frame", "button", "popover", "calendar", "date-range-picker"],
      ["date-range-picker"],
      new Set(),
      readRepoFile,
    );
    expect(entries.map((entry) => entry.name)).toEqual(["date-range-picker"]);
    expect(entries[0].category).toBe("form");
    expect(entries[0].source).toContain('from "@/components/ui/date-range-picker"');
  });

  it("fails on an item without a default demo that is not listed", () => {
    const item = { name: "ghost", type: "registry:ui", source: "", files: [] };
    expect(() =>
      smokeEntries(
        [{ ...item, files: [{ path: "registry/ui/ghost/ghost.tsx", type: "registry:ui" }] }],
        ["ghost"],
        ["ghost"],
        new Set(),
        () => undefined,
      ),
    ).toThrow(/ghost: no registry\/ui\/ghost\/demos\/default.tsx/);
  });
});

describe("installDemoSource", () => {
  const paths = installPaths(
    [{ name: "button", files: [{ path: "registry/ui/button/button.tsx", type: "registry:ui" }] }],
    new Set(),
  );

  it("rewrites repo imports to install paths and leaves the rest", () => {
    const source = `import { Button } from "@/registry/ui/button/button";\nimport { X } from "lucide-react";\n`;
    expect(installDemoSource(source, "demo", paths)).toBe(
      `import { Button } from "@/components/ui/button";\nimport { X } from "lucide-react";\n`,
    );
  });

  it("throws on a repo import the project lacks", () => {
    expect(() =>
      installDemoSource(`import { Card } from "@/registry/ui/card/card";`, "demo", paths),
    ).toThrow(/demo: .*"@\/registry\/ui\/card\/card", which is not installed/);
  });
});

describe("variantCopies", () => {
  it("copies a variant's files but its route, pointing its own imports at the copies", () => {
    const login = registry.items.find((item) => item.name === "login-02");
    if (!login) throw new Error("login-02 missing");
    const copies = variantCopies(login, (file) =>
      file === "components/login-form.tsx"
        ? `import { Button } from "@/components/ui/button";\nexport function LoginForm() {}\n`
        : "",
    );
    expect(copies.map((copy) => copy.file)).toContain(
      "smoke-variants/login-02/components/login-form.tsx",
    );
    expect(copies.some((copy) => copy.file.endsWith("page.tsx"))).toBe(false);
    expect(
      installPaths([login], new Set(["login-02"])).get(
        "registry/blocks/login-02/components/login-form",
      ),
    ).toBe("smoke-variants/login-02/components/login-form");
  });

  it("rewrites imports between a variant's own files", () => {
    const item = {
      name: "sidebar-x",
      files: [
        {
          path: "registry/blocks/sidebar-x/app-sidebar.tsx",
          type: "registry:component",
          target: "@components/app-sidebar.tsx",
        },
        {
          path: "registry/blocks/sidebar-x/nav-main.tsx",
          type: "registry:component",
          target: "@components/nav-main.tsx",
        },
      ],
    };
    const [sidebar] = variantCopies(item, (file) =>
      file === "components/app-sidebar.tsx"
        ? `import { NavMain } from "@/components/nav-main";\nimport { Sidebar } from "@/components/ui/sidebar";\n`
        : "",
    );
    expect(sidebar.content).toBe(
      `import { NavMain } from "@/smoke-variants/sidebar-x/components/nav-main";\nimport { Sidebar } from "@/components/ui/sidebar";\n`,
    );
  });
});

describe("smokePageFiles", () => {
  it("writes each demo and one page per category that renders them", () => {
    const files = smokePageFiles([
      { name: "date-range-picker", category: "form", source: "A" },
      { name: "stat-card", category: "display", source: "B" },
      { name: "file-upload", category: "form", source: "C" },
    ]);
    expect(files.map((file) => file.file)).toEqual([
      "app/smoke/form/_demos/date-range-picker.tsx",
      "app/smoke/form/_demos/file-upload.tsx",
      "app/smoke/form/page.tsx",
      "app/smoke/display/_demos/stat-card.tsx",
      "app/smoke/display/page.tsx",
    ]);
    const form = files.find((file) => file.file === "app/smoke/form/page.tsx")?.content ?? "";
    expect(form).toContain('import DateRangePickerDemo from "./_demos/date-range-picker";');
    expect(form).toContain("<FileUploadDemo />");
    expect(form).toContain("export default function SmokeFormPage()");
  });
});
