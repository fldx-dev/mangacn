import { describe, expect, it } from "vitest";
import {
  findHookProblems,
  HOOKS_CATALOG,
  hookLibSpecifiers,
  hookLibTarget,
  hookTarget,
  isHook,
} from "./hooks";
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

describe("hook lib companions", () => {
  const files = [
    {
      path: "registry/hooks/use-highlighted-code.ts",
      type: "registry:hook",
      target: "@hooks/use-highlighted-code.ts",
    },
    {
      path: "registry/hooks/lib/highlighter.tsx",
      type: "registry:lib",
      target: "@lib/highlighter.tsx",
    },
  ];

  it("lands a companion in the user's lib folder, where stock's copy does", () => {
    expect(hookLibTarget("lib/highlighter.tsx")).toBe("@lib/highlighter.tsx");
    expect(hookLibSpecifiers({ files })).toEqual(["@/lib/highlighter"]);
  });

  it("accepts a hook file followed by its registry:lib companions", () => {
    expect(findHookProblems(registry(hook({ name: "use-highlighted-code", files })))).toEqual([]);
  });

  it("refuses a companion outside registry/hooks/lib/ or at another target", () => {
    const [first, lib] = files;
    const wrong = hook({
      name: "use-highlighted-code",
      files: [
        first,
        { ...lib, target: "@/lib/highlighter.tsx" },
        { path: "registry/hooks/highlighter.tsx", type: "registry:lib" },
      ] as typeof files,
    });
    expect(findHookProblems(registry(wrong))).toEqual([
      'use-highlighted-code: registry/hooks/lib/highlighter.tsx has target "@/lib/highlighter.tsx"; expected "@lib/highlighter.tsx"',
      "use-highlighted-code: registry/hooks/highlighter.tsx (registry:lib) is not a registry:lib companion in registry/hooks/lib/",
    ]);
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
      "use-mobile: ships registry/hooks/use-mobile/use-mobile.ts first; expected registry/hooks/use-mobile.ts",
      'use-mobile: registry/hooks/use-mobile/use-mobile.ts has type "registry:lib"',
      'use-mobile: registry/hooks/use-mobile/use-mobile.ts has target "@/hooks/use-mobile.ts"; expected "@hooks/use-mobile.ts"',
      "use-mobile: registry/hooks/use-mobile.ts (registry:hook) is not a registry:lib companion in registry/hooks/lib/",
      'use-mobile: depends on "https://www.mangacn.com/r/ink-frame.json" (a hook imports React, its packages and its own lib only)',
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
      "use-mobile: ships no file; expected registry/hooks/use-mobile.ts first",
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
