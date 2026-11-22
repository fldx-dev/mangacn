import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedVariantItems } from "../lib/e2e-filter";
import { hydrateAfterReveal, waitForInk } from "./ready";

// Lane B's own checks (SPEC-components-8 §5.3, §5.5): the keyboard paths of onboarding-01 and
// activity-01 in a real browser. The catalog-driven ones (axe in both modes, one main, no
// overflow at 360, the shots) are e2e/blocks.spec.ts's.

const only = selectedVariantItems(parseE2eItems(process.env.E2E_ITEMS));

async function openView(page: Page, name: string) {
  await hydrateAfterReveal(page);
  const response = await page.goto(`/view/${name}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-variant-ready", "true");
  await waitForInk(page);
}

async function noOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe("onboarding-01", () => {
  test.skip(only !== undefined && !only.includes("onboarding-01"), "E2E_ITEMS leaves it out");

  test("Next on an empty name shows the error and focuses the field", async ({ page }) => {
    await openView(page, "onboarding-01");
    await page.getByRole("button", { name: "Next" }).click();
    const name = page.getByRole("textbox", { name: /Name/ });
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator('[data-slot="field-error"]')).toHaveText("Enter your name.");
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("Profile");
  });

  test("walks to Done by keyboard, focus on each step heading; Back keeps the answers", async ({
    page,
  }) => {
    await openView(page, "onboarding-01");
    const heading = page.getByRole("heading", { level: 2 });
    const name = page.getByRole("textbox", { name: /Name/ });
    await name.focus();
    await page.keyboard.type("Aiko");
    await page.keyboard.press("Enter");
    await expect(heading).toHaveText("Interests");
    await expect(heading).toBeFocused();
    await expect(page.getByRole("status").filter({ hasText: "Step 2 of 4" })).toHaveText(
      "Step 2 of 4, Interests",
    );

    // Tab into the grid, Space on three genres.
    for (const genre of ["Action", "Adventure", "Comedy"]) {
      await page.keyboard.press("Tab");
      await expect(page.getByRole("checkbox", { name: genre })).toBeFocused();
      await page.keyboard.press("Space");
    }
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(3);

    // Back keeps the answers, and Next comes back to them.
    await page.getByRole("button", { name: "Back" }).focus();
    await page.keyboard.press("Enter");
    await expect(heading).toHaveText("Profile");
    await expect(heading).toBeFocused();
    await expect(name).toHaveValue("Aiko");
    await page.getByRole("button", { name: "Next" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(3);
    await page.getByRole("button", { name: "Next" }).focus();
    await page.keyboard.press("Enter");

    await expect(heading).toHaveText("Habits");
    await expect(heading).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("switch", { name: /Daily reminder/ })).toBeFocused();
    await page.keyboard.press("Space");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("spinbutton", { name: /Hours/ })).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await page.getByRole("button", { name: "Finish" }).focus();
    await page.keyboard.press("Enter");

    await expect(heading).toHaveText("Done");
    await expect(heading).toBeFocused();
    await expect(page.getByText("On, at 22:00")).toBeVisible();
    await expect(page.getByText("Action, Adventure, Comedy")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to library" })).toBeVisible();
    await noOverflow(page);
  });
});

test.describe("activity-01", () => {
  test.skip(only !== undefined && !only.includes("activity-01"), "E2E_ITEMS leaves it out");

  test("the filter changes the count and announces it", async ({ page }) => {
    await openView(page, "activity-01");
    const status = page.getByRole("status");
    await expect(status).toHaveText("30 events");
    await page.getByRole("button", { name: "Follows" }).click();
    await expect(status).toHaveText("7 events");
    await expect(page.getByRole("heading", { level: 4 })).toHaveCount(7);
    await expect(page.getByRole("button", { name: "Show more" })).toHaveCount(0);
  });

  test("Show more moves focus to the first new event", async ({ page }) => {
    await openView(page, "activity-01");
    const more = page.getByRole("button", { name: "Show more" });
    await more.focus();
    await page.keyboard.press("Enter");
    const events = page.getByRole("heading", { level: 4 });
    await expect(events).toHaveCount(20);
    await expect(events.nth(10)).toBeFocused();
    await noOverflow(page);
  });

  test("the stats sit in 1 / 2 / 4 columns at 360 / 768 / 1280", async ({ page }, testInfo) => {
    await openView(page, "activity-01");
    const columns = { w360: 1, w768: 2, w1280: 4 }[testInfo.project.name] ?? 1;
    const tops = await page
      .getByRole("region", { name: "Overview" })
      .locator("li")
      .evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
    expect(tops.filter((top) => top === tops[0])).toHaveLength(columns);
    await noOverflow(page);
  });
});
