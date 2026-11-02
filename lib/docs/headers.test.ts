import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

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
