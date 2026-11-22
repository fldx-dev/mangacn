import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedVariantItems } from "../lib/e2e-filter";
import { hydrateAfterReveal, waitForInk } from "./ready";

// Lane A's own checks (SPEC-components-6 §3): the auth variants login-03 to -05 and signup-02
// to -05. The catalog-driven ones (axe in both modes, one main, no overflow at 360, the shots)
// are e2e/blocks.spec.ts's. Each form is named by its heading; a cover panel is decorative (out
// of the accessibility tree) and keeps stock's place (absent under stock's breakpoint); social
// marks are drawn in the text's ink, never a brand colour.

interface AuthBlock {
  /** The form's accessible name: its heading. */
  form: string;
  /** Social buttons' accessible names, stock's labels (visible or sr-only). */
  social: string[];
  /** The width from which the cover panel shows; absent when the block has none. */
  cover?: number;
}

const BLOCKS: Record<string, AuthBlock> = {
  "login-03": { form: "Welcome back", social: ["Login with Apple", "Login with Google"] },
  "login-04": {
    form: "Welcome back",
    social: ["Login with Apple", "Login with Google", "Login with Meta"],
    cover: 768,
  },
  "login-05": {
    form: "Welcome to Inkpot Studio.",
    social: ["Continue with Apple", "Continue with Google"],
  },
  "signup-02": { form: "Create your account", social: ["Sign up with GitHub"], cover: 1024 },
  "signup-03": { form: "Create your account", social: [] },
  "signup-04": {
    form: "Create your account",
    social: ["Sign up with Apple", "Sign up with Google", "Sign up with Meta"],
    cover: 768,
  },
  "signup-05": {
    form: "Welcome to Inkpot Studio.",
    social: ["Continue with Apple", "Continue with Google"],
  },
};

const only = selectedVariantItems(parseE2eItems(process.env.E2E_ITEMS));
const COVER = '[aria-hidden="true"]:has([data-slot="manga-frame"])';

async function openView(page: Page, name: string, mode: "light" | "dark" = "light") {
  await hydrateAfterReveal(page);
  const response = await page.goto(`/view/${name}${mode === "dark" ? "?mode=dark" : ""}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-variant-ready", "true");
  await waitForInk(page);
}

for (const [name, block] of Object.entries(BLOCKS)) {
  test.describe(name, () => {
    test.skip(only !== undefined && !only.includes(name), `E2E_ITEMS leaves ${name} out`);

    test("the form is named by its heading, and its social marks are in ink", async ({ page }) => {
      await openView(page, name);
      const form = page.getByRole("form", { name: block.form });
      await expect(form).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: block.form })).toBeVisible();
      for (const label of block.social) {
        const button = page.getByRole("button", { name: label });
        await expect(button, label).toBeVisible();
        const ink = await button
          .locator('svg[viewBox="0 0 24 24"] path')
          .evaluateAll((paths) =>
            paths.map((path) => [getComputedStyle(path).fill, getComputedStyle(path).color]),
          );
        expect(ink.length, label).toBeGreaterThan(0);
        for (const [fill, color] of ink) expect(fill, label).toBe(color);
      }
    });

    if (block.cover !== undefined) {
      const from = block.cover;
      test("the cover panel is hidden from the accessibility tree, and shown in stock's place", async ({
        page,
      }) => {
        await openView(page, name);
        const cover = page.locator(COVER);
        await expect(cover).toHaveCount(1);
        await expect(page.locator('[data-slot="manga-frame"]')).toHaveCount(1);
        await expect(page.getByRole("figure")).toHaveCount(0);
        if ((page.viewportSize()?.width ?? 0) < from) {
          await expect(cover).toBeHidden();
        } else {
          await expect(cover).toBeVisible();
          for (const slot of ["halftone-background", "focus-lines", "sfx-text"]) {
            await expect(cover.locator(`[data-slot="${slot}"]`), slot).toHaveCount(1);
          }
        }
      });

      test("the cover follows the theme in dark mode", async ({ page }) => {
        test.skip((page.viewportSize()?.width ?? 0) < from, "the cover is hidden at this width");
        const paperOf = () =>
          page
            .locator(`${COVER} [data-slot="manga-frame-scene"]`)
            .evaluate((scene) => getComputedStyle(scene).backgroundColor);
        await openView(page, name);
        const light = await paperOf();
        await openView(page, name, "dark");
        await expect(page.locator("html")).toHaveClass(/\bdark\b/);
        expect(await paperOf()).not.toBe(light);
      });
    }
  });
}
