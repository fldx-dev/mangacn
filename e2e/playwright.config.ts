import { execFileSync } from "node:child_process";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const root = path.resolve(__dirname, "..");

/**
 * A free TCP port, picked once in the runner process and handed to workers through the
 * environment (Playwright re-evaluates this config in every worker).
 */
function freePort(): string {
  process.env.E2E_PORT ??= execFileSync(
    process.execPath,
    [
      "-e",
      "const s=require('node:net').createServer();s.listen(0,'127.0.0.1',()=>{process.stdout.write(String(s.address().port));s.close()})",
    ],
    { encoding: "utf8" },
  );
  return process.env.E2E_PORT;
}

const port = freePort();
const widths = [360, 768, 1280];

// Visual suite over the demo stage (SPEC-components §8). Needs a production build first
// (`pnpm build`); pixel comparison only runs on Linux, where the baselines are made.
export default defineConfig({
  testDir: ".",
  outputDir: "test-results",
  snapshotPathTemplate: "{testDir}/__screenshots__/linux/{projectName}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: widths.map((width) => ({
    name: `w${width}`,
    use: { viewport: { width, height: 800 } },
  })),
  webServer: {
    command: `pnpm start --port ${port} --hostname 127.0.0.1`,
    cwd: root,
    url: `http://127.0.0.1:${port}/demo/button/default`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
