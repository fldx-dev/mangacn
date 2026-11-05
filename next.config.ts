import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Every docs page as Markdown for agents at its own URL plus `.md` (app/llms.mdx).
  async rewrites() {
    return [
      { source: "/docs.md", destination: "/llms.mdx" },
      { source: "/docs/:slug*.md", destination: "/llms.mdx/:slug*" },
    ];
  },
  // The registry (`public/r`, built by `pnpm registry:build`): a short browser cache, a longer
  // CDN cache, and open CORS so any tool can fetch the items. Next sets the JSON content type.
  async headers() {
    return [
      {
        source: "/r/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
          },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET" },
        ],
      },
      // The docs MCP server (app/api/mcp): open CORS for browser-based clients, with the
      // headers the streamable HTTP transport reads and writes.
      {
        source: "/api/mcp",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, DELETE, OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Mcp-Method, Mcp-Name, Last-Event-ID",
          },
          { key: "Access-Control-Expose-Headers", value: "Mcp-Session-Id, Mcp-Protocol-Version" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
  // The MCP route reads the catalog (registry.json, the shipped files it scans for imports) and
  // the skill folder from disk on its first call, so its server bundle carries them.
  outputFileTracingIncludes: {
    "/api/mcp": ["./registry.json", "./registry/**/*", "./skills/mangacn/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Adds the MDX/meta loaders and the `fumadocs-mdx/macro` transform (lib/docs/source.ts);
// the Turbopack rules above are spread into its own.
const withMDX = createMDX();

export default withMDX(nextConfig);
