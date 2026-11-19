import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";
import { hydrateAfterReveal, waitForInk } from "./ready";

// login-02's own checks (SPEC-components-6 §3, §5.1); the catalog-driven ones (axe in both
// modes, one main, no overflow at 360, the shots) are e2e/blocks.spec.ts's. The cover is a manga
// panel of shipped items: decorative, so out of the accessibility tree; in stock's place, so
// absent under lg, where stock hides its image; and on the theme's tokens in dark mode.

const only = selectedDemoItems(parseE2eItems(process.env.E2E_ITEMS));
test.skip(only !== undefined && !only.includes("login-02"), "E2E_ITEMS leaves login-02 out");

const COVER = '[aria-hidden="true"]:has([data-slot="manga-frame"])';

async function openView(page: Page, mode: "light" | "dark") {
  await hydrateAfterReveal(page);
  const response = await page.goto(`/view/login-02${mode === "dark" ? "?mode=dark" : ""}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
  await waitForInk(page);
}

test("the cover panel is hidden from the accessibility tree, and shown from lg up", async ({
  page,
}, testInfo) => {
  await openView(page, "light");
  const cover = page.locator(COVER);
  await expect(cover).toHaveCount(1);
  await expect(page.locator('[data-slot="manga-frame"]')).toHaveCount(1);
  // The sound effect is real text, but under aria-hidden: no role or name reaches the tree.
  expect(await page.getByRole("main").ariaSnapshot()).not.toMatch(/kacha/i);
  await expect(page.getByRole("figure")).toHaveCount(0);

  const width = page.viewportSize()?.width ?? 0;
  if (width < 1024) {
    await expect(cover, `no cover at ${testInfo.project.name}`).toBeHidden();
  } else {
    await expect(cover).toBeVisible();
    for (const slot of ["halftone-background", "focus-lines", "sfx-text"]) {
      await expect(cover.locator(`[data-slot="${slot}"]`), slot).toHaveCount(1);
    }
  }
  await expect(page.getByRole("form", { name: "Login to your account" })).toBeVisible();
});

test("the cover follows the theme in dark mode", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, "the cover shows from lg up");
  const paperOf = async () =>
    page
      .locator(`${COVER} [data-slot="manga-frame-scene"]`)
      .evaluate((scene) => getComputedStyle(scene).backgroundColor);
  await openView(page, "light");
  const light = await paperOf();
  await openView(page, "dark");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  expect(await paperOf()).not.toBe(light);
});

test("the docs Files line says login-02 replaces login-01's files", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) !== 1280, "one width is enough for prose");
  const response = await page.goto("/docs/blocks/login-02");
  expect(response?.status()).toBe(200);
  const line = page.locator('[data-slot="item-files"]');
  await expect(line).toContainText(
    "Replaces app/login/page.tsx and components/login-form.tsx from login-01",
  );
});
