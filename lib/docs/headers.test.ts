import { describe, expect, it, vi } from "vitest";
import nextConfig from "../../next.config";

// next.config.ts wraps the config in fumadocs-mdx's createMDX(), which starts its file
// generator on import (esbuild, then writes under .source/). Under jsdom on the threads pool
// esbuild's TextEncoder invariant failed across realms and printed "[MDX] failed to generate
// files"; the headers need none of it, so the wrapper is the identity here.
vi.mock("fumadocs-mdx/next", () => ({
  createMDX: () => (config: unknown) => config,
}));

// The rule as configured; the served response (content type included) is checked with
// `next build` + `next start` + `curl -I` (see the task notes).

/** The /r/ rule: every path under /r/ but the Create routes, which set their own (app/r/create). */
const REGISTRY_SOURCE = "/r/:path((?!create/).*)";

describe("registry response headers", () => {
  it("leaves /r/create/ to its routes and covers every other /r/ path", () => {
    const pattern = /^\/r\/:path\((.*)\)$/.exec(REGISTRY_SOURCE)?.[1] ?? "";
    const matches = (path: string) => new RegExp(`^${pattern}$`).test(path.replace(/^\/r\//, ""));
    expect(matches("/r/button.json")).toBe(true);
    expect(matches("/r/registry.json")).toBe(true);
    expect(matches("/r/create/10.json")).toBe(false);
    expect(matches("/r/create/10/theme.json")).toBe(false);
  });

  it("serves the static items with the cache and CORS headers", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const registry = rules.find((rule) => rule.source === REGISTRY_SOURCE);

    expect(registry).toBeDefined();
    expect(
      Object.fromEntries(registry?.headers.map(({ key, value }) => [key, value]) ?? []),
    ).toEqual({
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    });
  });
});
