import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";
import { waitForInk } from "./ready";

// Lane A's browser-only checks (SPEC-components-7 §5): date-range-picker's popover stays in
// the viewport at every width and hands focus back, a range picked by keyboard alone, and
// time-picker's typing across its segments. Axe, overflow and the shots are e2e/demos.spec.ts's.

const only = selectedDemoItems(parseE2eItems(process.env.E2E_ITEMS));

async function openDemo(page: Page, item: string, demo: string) {
  const response = await page.goto(`/demo/${item}/${demo}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
  await waitForInk(page);
}

test.describe("date-range-picker", () => {
  test.skip(only !== undefined && !only.includes("date-range-picker"), "E2E_ITEMS leaves it out");

  test("the popover stays inside the viewport and Escape returns focus", async ({ page }) => {
    await openDemo(page, "date-range-picker", "default");
    const trigger = page.locator('[data-slot="date-range-picker-trigger"]');
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    }
    const months = viewport.width < 768 ? 1 : 2;
    await expect(dialog.locator(".rdp-month")).toHaveCount(months);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
    // Focus went into the grid, on the range's first day.
    await expect(page.locator(":focus")).toHaveAttribute("aria-label", /June 8, 2026/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("a range is picked with the keyboard alone and the popover stays open", async ({ page }) => {
    await openDemo(page, "date-range-picker", "field");
    const trigger = page.locator('[data-slot="date-range-picker-trigger"]');
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // The field's month is August 2026; with no range and today elsewhere, its 1st takes focus.
    await expect(page.locator(":focus")).toHaveAttribute("aria-label", /August 1, 2026/);
    await page.keyboard.press("Enter");
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
    await expect(page.locator(":focus")).toHaveAttribute("aria-label", /August 4, 2026/);
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await expect(page.locator('input[name="booth-from"]')).toHaveValue("2026-08-01");
    await expect(page.locator('input[name="booth-to"]')).toHaveValue("2026-08-04");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveText("Aug 1, 2026 – Aug 4, 2026");
  });
});

test.describe("time-picker", () => {
  test.skip(only !== undefined && !only.includes("time-picker"), "E2E_ITEMS leaves it out");

  test("typing fills each segment and moves on to the next", async ({ page }) => {
    await openDemo(page, "time-picker", "default");
    const hours = page.getByRole("spinbutton", { name: "Hours" });
    const minutes = page.getByRole("spinbutton", { name: "Minutes" });
    await hours.click();
    await page.keyboard.type("0745");
    await expect(hours).toHaveAttribute("aria-valuetext", "07");
    await expect(minutes).toHaveAttribute("aria-valuetext", "45");
    await expect(minutes).toBeFocused();
    await expect(hours).toHaveText("07");
    await page.keyboard.press("ArrowUp");
    await expect(minutes).toHaveText("46");
  });

  test("12-hour typing reaches AM/PM and P sets the afternoon", async ({ page }) => {
    await openDemo(page, "time-picker", "twelve-hour");
    const period = page.getByRole("spinbutton", { name: "AM/PM" });
    await page.getByRole("spinbutton", { name: "Hours" }).click();
    await page.keyboard.type("0930");
    await expect(period).toBeFocused();
    await page.keyboard.press("a");
    await expect(period).toHaveAttribute("aria-valuetext", "AM");
    await page.keyboard.press("p");
    await expect(period).toHaveAttribute("aria-valuetext", "PM");
    await expect(page.getByRole("spinbutton", { name: "Hours" })).toHaveText("09");
  });
});
