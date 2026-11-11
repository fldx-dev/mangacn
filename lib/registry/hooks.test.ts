import { describe, expect, it } from "vitest";
import { findHookProblems, HOOKS_CATALOG, hookTarget, isHook } from "./hooks";
import type { LoadedRegistry, LoadedRegistryItem } from "./index";

function hook(overrides: Partial<LoadedRegistryItem> = {}): LoadedRegistryItem {
  return {
    name: "use-mobile",
    type: "registry:hook",
    categories: ["hook"],
    files: [
      {
        path: "registry/hooks/use-mobile.ts",
        type: "registry:hook",
        target: "@hooks/use-mobile.ts",
      },
    ],
    source: HOOKS_CATALOG,
    ...overrides,
  };
}

function registry(...items: LoadedRegistryItem[]): LoadedRegistry {
  return { name: "fixture", homepage: "", items };
}

describe("hookTarget", () => {
  it("puts the hook in the user's hooks folder through the @hooks alias", () => {
    expect(hookTarget("use-mobile")).toBe("@hooks/use-mobile.ts");
  });
});

describe("findHookProblems", () => {
  it("accepts a well-formed hook", () => {
    expect(isHook(hook())).toBe(true);
    expect(findHookProblems(registry(hook()))).toEqual([]);
  });

  it("names every broken rule", () => {
    const broken = hook({
      type: "registry:lib",
      categories: ["data"],
      registryDependencies: ["https://www.mangacn.com/r/ink-frame.json"],
      files: [
        {
          path: "registry/hooks/use-mobile/use-mobile.ts",
          type: "registry:lib",
          target: "@/hooks/use-mobile.ts",
        },
        { path: "registry/hooks/use-mobile.ts", type: "registry:hook" },
      ],
    });
    expect(findHookProblems(registry(broken))).toEqual([
      'use-mobile: type is "registry:lib"; expected "registry:hook"',
      'use-mobile: first category is "data"; expected "hook"',
      "use-mobile: ships 2 files; expected one, registry/hooks/use-mobile.ts",
      "use-mobile: ships registry/hooks/use-mobile/use-mobile.ts; expected registry/hooks/use-mobile.ts",
      'use-mobile: registry/hooks/use-mobile/use-mobile.ts has type "registry:lib"',
      'use-mobile: registry/hooks/use-mobile/use-mobile.ts has target "@/hooks/use-mobile.ts"; expected "@hooks/use-mobile.ts"',
      'use-mobile: registry/hooks/use-mobile.ts has target undefined; expected "@hooks/use-mobile.ts"',
      'use-mobile: depends on "https://www.mangacn.com/r/ink-frame.json" (a hook imports React and the platform only)',
    ]);
  });

  it("rejects a hook without files and a hook outside the hook catalog", () => {
    expect(
      findHookProblems(
        registry(
          hook({ files: [] }),
          hook({ name: "use-stray", source: "registry/ui/registry.json" }),
        ),
      ),
    ).toEqual([
      "use-mobile: ships 0 files; expected one, registry/hooks/use-mobile.ts",
      "use-stray: hooks belong in registry/hooks/registry.json",
    ]);
  });

  it("ignores items of other types outside the hook catalog", () => {
    expect(
      findHookProblems(
        registry(
          hook({ name: "button", type: "registry:ui", source: "registry/ui/registry.json" }),
        ),
      ),
    ).toEqual([]);
  });
});
