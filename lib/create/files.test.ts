import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { installTarget } from "@/lib/registry/install-target";
import { DEFAULT_CONFIG } from "./config";
import { type InstallPlan, installPlan, nextTarget } from "./files";
import { KIT_CATALOG_V1, KIT_NAMES } from "./kits";

describe("nextTarget", () => {
  it("writes every catalog file where lib/registry/install-target.ts says shadcn writes it", () => {
    for (const item of loadRegistry().items) {
      for (const file of item.files) expect(nextTarget(file)).toBe(installTarget(file));
    }
  });
});

describe("installPlan", () => {
  it("lists the default code's theme, fonts and kit in Next.js", () => {
    const plan = installPlan(DEFAULT_CONFIG);
    expect(plan.stylesheet).toBe("app/globals.css");
    expect(plan.fontFile).toBe("app/layout.tsx");
    expect(plan.fonts).toEqual(["Dela Gothic One", "Shantell Sans", "Yusei Magic"]);
    expect(plan.kit.map((item) => [item.name, item.files])).toEqual([
      ["ink-frame", ["components/ink-frame.tsx"]],
      ["speech-bubble", ["components/speech-bubble.tsx"]],
      ["button", ["components/ui/button.tsx"]],
    ]);
    expect(plan.kit.every((item) => item.skipped.length === 0)).toBe(true);
    expect(plan.packages).toEqual([
      "@base-ui/react",
      "class-variance-authority",
      "cn",
      "roughjs@4.6.6",
    ]);
    // No font package in Next.js: next/font loads the faces.
    expect(plan.packages.some((name) => name.startsWith("@fontsource/"))).toBe(false);
  });

  it("puts Vite's files under src/, skips page files and adds the Fontsource packages", () => {
    const shell = { ...DEFAULT_CONFIG, kit: { preset: "app-shell" as const } };
    const next = installPlan(shell, "next");
    const vite = installPlan(shell, "vite");
    expect(vite.stylesheet).toBe("src/index.css");
    expect(vite.fontFile).toBe("src/index.css");
    const login = (plan: InstallPlan) => plan.kit.find((item) => item.name === "login-01");
    expect(login(next)?.files).toContain("app/login/page.tsx");
    expect(login(vite)?.files).not.toContain("app/login/page.tsx");
    expect(login(vite)?.skipped).toEqual(["app/login/page.tsx"]);
    for (const item of [...vite.kit, ...vite.brought]) {
      for (const file of item.files) expect(file).toMatch(/^src\//);
    }
    expect(vite.packages).toEqual(
      expect.arrayContaining([
        "@fontsource/dela-gothic-one",
        "@fontsource/shantell-sans",
        "@fontsource/yusei-magic",
      ]),
    );
  });

  it("lists a code's alternative faces, and their Fontsource packages in Vite (Task C7)", () => {
    const fonts = { display: "reggae-one", dialogue: "patrick-hand-sc" } as const;
    const config = { ...DEFAULT_CONFIG, fonts };
    expect(installPlan(config, "next").fonts).toEqual([
      "Reggae One",
      "Patrick Hand SC",
      "Yusei Magic",
    ]);
    const vite = installPlan(config, "vite");
    expect(vite.fonts).toEqual(["Reggae One", "Patrick Hand SC", "Yusei Magic"]);
    expect(vite.packages).toEqual(
      expect.arrayContaining([
        "@fontsource/reggae-one",
        "@fontsource/patrick-hand-sc",
        "@fontsource/yusei-magic",
      ]),
    );
    expect(vite.packages).not.toContain("@fontsource/dela-gothic-one");
    expect(vite.packages).not.toContain("@fontsource/shantell-sans");
    // One choice moves only its own role.
    expect(
      installPlan({ ...DEFAULT_CONFIG, fonts: { ...DEFAULT_CONFIG.fonts, display: "reggae-one" } })
        .fonts,
    ).toEqual(["Reggae One", "Shantell Sans", "Yusei Magic"]);
  });

  it("lists each brought item once, never a kit item, the theme or a font", () => {
    for (const kit of KIT_NAMES) {
      const plan = installPlan({ ...DEFAULT_CONFIG, kit: { preset: kit } });
      const kitNames = plan.kit.map((item) => item.name);
      const brought = plan.brought.map((item) => item.name);
      expect(new Set(brought).size).toBe(brought.length);
      for (const name of brought) {
        expect(kitNames).not.toContain(name);
        expect(name).not.toMatch(/^(theme|font-)/);
      }
    }
    const everything = installPlan({ ...DEFAULT_CONFIG, kit: { custom: [...KIT_CATALOG_V1] } });
    expect(everything.kit.map((item) => item.name)).toEqual([...KIT_CATALOG_V1]);
  });

  it("brings what a block depends on: sidebar-07 brings the sidebar and the ink frame", () => {
    expect(installPlan(DEFAULT_CONFIG).brought).toEqual([]);
    const shell = installPlan({ ...DEFAULT_CONFIG, kit: { custom: ["sidebar-07"] } });
    expect(shell.brought.map((item) => item.name)).toEqual(
      expect.arrayContaining(["sidebar", "ink-frame"]),
    );
  });
});
