import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { EXAMPLES_GROUP, examplePageTarget, PAGE_TYPE } from "@/lib/registry/blocks";

// Every page block installs its route as an example under one route group, so a user deletes
// `app/(mangacn-examples)/` to drop them all, and no block takes over a real route of the app.
const pages = loadRegistry().items.flatMap((item) =>
  item.files
    .filter((file) => file.type === PAGE_TYPE)
    .map((file) => ({ name: item.name, target: file.target })),
);

describe("page block routes", () => {
  it("are all found", () => {
    expect(pages.length).toBeGreaterThan(30);
  });

  it("all install under app/(mangacn-examples)/examples/<block>/", () => {
    for (const { name, target } of pages) {
      expect(target, name).toBe(examplePageTarget(name));
      expect(target?.startsWith(`app/${EXAMPLES_GROUP}/examples/`), name).toBe(true);
    }
  });

  it("never share a route, with each other or with an app's common routes", () => {
    // A route group adds no URL segment: the URL is the target without the group.
    const urls = pages.map(({ target }) =>
      (target ?? "")
        .replace(`/${EXAMPLES_GROUP}`, "")
        .replace(/^app/, "")
        .replace(/\/page\.tsx$/, ""),
    );
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expect(url).toMatch(/^\/examples\/[a-z0-9-]+$/);
      for (const common of [
        "/login",
        "/signup",
        "/dashboard",
        "/series",
        "/library",
        "/settings",
      ]) {
        expect(url.startsWith(common), url).toBe(false);
      }
    }
  });
});
