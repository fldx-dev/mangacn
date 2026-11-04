import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { waitForInk } from "./ready";

// The site pages (SPEC-docs-site §11), light and dark, at each project's width: pixels on
// Linux only (CI), and everywhere no overflow, no axe violations and no errors.
const comparePixels = process.platform === "linux";

const pages = [
  "/",
  "/docs",
  "/docs/installation",
  "/docs/theming",
  "/docs/components",
  "/docs/components/button",
  "/docs/components/speech-bubble",
  "/docs/components/page-turn",
];

/** `/` → `home`, `/docs/components/button` → `docs-components-button`. */
function slug(path: string): string {
  return path === "/" ? "home" : path.slice(1).replaceAll("/", "-");
}

/**
 * Overlay demos (dialog, sheet, tooltip, popover) render their stage in an iframe, which takes
 * `?mode=dark` once the page has hydrated: wait for that stage to load, then for its ink.
 */
async function waitForStages(page: Page, mode: "light" | "dark") {
  const iframes = page.locator("iframe");
  for (const iframe of await iframes.all()) {
    await expect(iframe).toHaveAttribute("src", mode === "dark" ? /\?mode=dark$/ : /^[^?]+$/);
    const src = new URL((await iframe.getAttribute("src")) ?? "", page.url()).href;
    const handle = await iframe.elementHandle();
    await expect.poll(async () => (await handle?.contentFrame())?.url()).toBe(src);
    const frame = await handle?.contentFrame();
    if (!frame) throw new Error(`No frame for ${src}`);
    await expect(frame.locator("html")).toHaveAttribute("data-demo-ready", "true");
    await waitForInk(frame);
  }
}

for (const path of pages) {
  for (const mode of ["light", "dark"] as const) {
    test(`${path} (${mode})`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      // next-themes reads the stored theme before hydration; set it before any page script.
      await page.addInitScript((theme) => localStorage.setItem("theme", theme), mode);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      const html = page.locator("html");
      if (mode === "dark") await expect(html).toHaveClass(/\bdark\b/);
      else await expect(html).not.toHaveClass(/\bdark\b/);
      await waitForInk(page);
      await waitForStages(page, mode);

      if (comparePixels) {
        await expect(page).toHaveScreenshot(`site-${slug(path)}-${mode}.png`, { fullPage: true });
      }

      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, "no horizontal overflow").toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);

      // Base UI's focus guards around an open popup are aria-hidden sentinels with tabindex 0
      // that hand focus on at once; axe only lets them pass under an open dialog, so an open
      // menu or select stage (an iframe) would fail on Base UI's own markup. Every other node
      // of those stages is still checked.
      const { violations } = await new AxeBuilder({ page })
        .exclude("[data-base-ui-focus-guard]")
        .exclude(["iframe", "[data-base-ui-focus-guard]"])
        .analyze();
      const found = violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
      }));
      expect(found, "axe violations").toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

// The Markdown and registry routes (Tasks 43, 44): status, type and headers, once.
test("markdown and registry routes", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "w1280", "plain requests; one project is enough");

  const llms = await request.get("/llms.txt");
  expect(llms.status()).toBe(200);
  expect(llms.headers()["content-type"]).toMatch(/^text\/plain\b/);

  const full = await request.get("/llms-full.txt");
  expect(full.status()).toBe(200);
  expect(await full.text()).toContain("speech-bubble");

  const markdown = await request.get("/docs/components/button.md");
  expect(markdown.status()).toBe(200);
  expect(markdown.headers()["content-type"]).toMatch(/^text\/markdown\b/);

  const item = await request.get("/r/button.json");
  expect(item.status()).toBe(200);
  expect(item.headers()["content-type"]).toMatch(/^application\/json\b/);
  expect(item.headers()["access-control-allow-origin"]).toBe("*");
  expect(item.headers()["cache-control"]).toBe(
    "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
  );
});
