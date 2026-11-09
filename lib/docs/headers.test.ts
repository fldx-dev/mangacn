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

describe("registry response headers", () => {
  it("serves /r/:path* with the cache and CORS headers", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const registry = rules.find((rule) => rule.source === "/r/:path*");

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
