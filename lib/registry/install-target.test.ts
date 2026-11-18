import { describe, expect, it } from "vitest";
import type { LoadedRegistry } from "./index";
import { sharedInstallTargets } from "./install-target";

const page = (name: string, route: string, components: string[]) => ({
  name,
  type: "registry:block",
  source: "registry/blocks/registry.json",
  files: [
    { path: `registry/blocks/${name}/page.tsx`, type: "registry:page", target: route },
    ...components.map((file) => ({
      path: `registry/blocks/${name}/components/${file}.tsx`,
      type: "registry:component",
      target: `@components/${file}.tsx`,
    })),
  ],
});

const registry: LoadedRegistry = {
  name: "fixture",
  homepage: "",
  items: [
    page("login-01", "app/login/page.tsx", ["login-form"]),
    page("login-02", "app/login/page.tsx", ["login-form"]),
    page("signup-01", "app/signup/page.tsx", ["signup-form"]),
  ],
};

describe("sharedInstallTargets", () => {
  it("names each other item that writes one of the item's files, with the shared paths", () => {
    expect(sharedInstallTargets("login-02", registry)).toEqual([
      { item: "login-01", files: ["app/login/page.tsx", "components/login-form.tsx"] },
    ]);
    expect(sharedInstallTargets("login-01", registry)).toEqual([
      { item: "login-02", files: ["app/login/page.tsx", "components/login-form.tsx"] },
    ]);
  });

  it("is empty for an item that shares no path", () => {
    expect(sharedInstallTargets("signup-01", registry)).toEqual([]);
  });
});
