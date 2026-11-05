import { execFileSync } from "node:child_process";
import path from "node:path";
import { defineConfig } from "@playwright/test";
import { E2E_SUITES, parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";

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

// `E2E_ITEMS` narrows the run (lib/e2e-filter.ts): demo items for demos.spec.ts, and the
// suites `site`, `mcp`, `annotations` for their specs. Unset, empty or `all` runs everything.
const filter = parseE2eItems(process.env.E2E_ITEMS);
const demoItems = selectedDemoItems(filter);
const testIgnore = filter
  ? [
      ...(demoItems?.length ? [] : ["**/demos.spec.ts"]),
      ...E2E_SUITES.filter((suite) => !filter.has(suite)).map((suite) => `**/${suite}.spec.ts`),
    ]
  : [];
// Once, in the runner (workers re-evaluate this file with TEST_WORKER_INDEX set).
if (!process.env.TEST_WORKER_INDEX) {
  console.log(
    filter
      ? `E2E_ITEMS=${process.env.E2E_ITEMS}: ${
          demoItems?.length ? `demos of ${demoItems.join(", ")}` : "no demos"
        }; specs ${E2E_SUITES.filter((suite) => filter.has(suite)).join(", ") || "none"}`
      : `E2E_ITEMS${process.env.E2E_ITEMS ? `=${process.env.E2E_ITEMS}` : " unset"}: every demo and spec`,
  );
}

// Visual suite over the demo stage (SPEC-components §8). Needs a production build first
// (`pnpm build`); pixel comparison only runs on Linux, where the baselines are made.
export default defineConfig({
  testDir: ".",
  testIgnore,
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
