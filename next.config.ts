import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
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
