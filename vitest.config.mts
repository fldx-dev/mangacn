import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["registry/**/*.test.{ts,tsx}", "lib/**/*.test.ts"],
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["lib/registry/**"],
      exclude: ["lib/registry/**/*.test.ts", "lib/registry/**/__snapshots__/**"],
      reporter: ["text"],
      thresholds: {
        lines: 90,
      },
    },
  },
});
