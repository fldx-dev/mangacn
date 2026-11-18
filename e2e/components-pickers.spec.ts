import { expect, type Locator, type Page, test } from "@playwright/test";
import { parseE2eItems } from "../lib/e2e-filter";
import { waitForInk } from "./ready";

// Lane C pickers (SPEC-components-7 §4.5, §4.8), browser-only behaviour at every width: both
// popups stay inside the viewport and are as wide as they should be, Escape returns focus,
// and color-picker's 2D area works by keyboard and by pointer drag.

const filter = parseE2eItems(process.env.E2E_ITEMS);
test.skip(
  Boolean(filter) && !filter?.has("multi-select") && !filter?.has("color-picker"),
  "runs with multi-select or color-picker",
);

async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
  await waitForInk(page);
}

/** The element's box lies inside the viewport. */
async function expectInsideViewport(page: Page, locator: Locator) {
  const viewport = page.viewportSize();
  await expect
    .poll(async () => {
      const box = await locator.boundingBox();
      if (!box || !viewport) return false;
      return (
        box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= viewport.width &&
        box.y + box.height <= viewport.height
      );
    })
    .toBe(true);
}

/** Saturation and brightness from the area's value text. */
async function areaValue(area: Locator) {
  const text = (await area.getAttribute("aria-valuetext")) ?? "";
  const [saturation, brightness] = [...text.matchAll(/(\d+) %/g)].map((match) => Number(match[1]));
  return { saturation, brightness };
}

test("multi-select's popup is as wide as the field, inside the viewport; Escape keeps focus", async ({
  page,
}) => {
  await open(page, "/demo/multi-select/default");
  const input = page.getByRole("combobox", { name: "Genres" });
  await input.focus();
  await page.keyboard.press("ArrowDown");
  const popup = page.locator('[data-slot="combobox-content"]');
  await expect(popup).toBeVisible();
  const chips = page.locator('[data-slot="combobox-chips"]');
  await expect
    .poll(async () => {
      const [a, b] = await Promise.all([popup.boundingBox(), chips.boundingBox()]);
      return Math.round((a?.width ?? -1) - (b?.width ?? 0));
    })
    .toBe(0);
  await expectInsideViewport(page, popup);
  await page.keyboard.press("Escape");
  await expect(popup).toBeHidden();
  await expect(input).toBeFocused();
});

test("color-picker's panel stays inside the viewport and Escape returns focus to the trigger", async ({
  page,
}) => {
  await open(page, "/demo/color-picker/default");
  const trigger = page.getByRole("button", { name: "Accent, #e60012" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expectInsideViewport(page, dialog);
  // The area keeps a square aspect.
  const area = page.getByRole("slider", { name: "Saturation and brightness" });
  const box = await area.boundingBox();
  expect(Math.abs((box?.width ?? 0) - (box?.height ?? -1))).toBeLessThanOrEqual(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("color-picker's 2D area moves by keyboard, Shift for steps of 10", async ({ page }) => {
  await open(page, "/demo/color-picker/inline");
  const area = page.getByRole("slider", { name: "Saturation and brightness" });
  await area.focus();
  const start = await areaValue(area);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Shift+ArrowDown");
  expect(await areaValue(area)).toEqual({
    saturation: start.saturation - 1,
    brightness: start.brightness - 10,
  });
  // The value reaches the demo's readout.
  await expect(page.getByText(/^Ink: #[0-9a-f]{6}$/)).not.toHaveText("Ink: #1d2088");
});

test("color-picker's 2D area follows a pointer drag", async ({ page }) => {
  await open(page, "/demo/color-picker/inline");
  const area = page.getByRole("slider", { name: "Saturation and brightness" });
  const box = await area.boundingBox();
  if (!box) throw new Error("no area box");
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.25);
  await page.mouse.down();
  await expect(area).toHaveAttribute("data-dragging", "true");
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.75, { steps: 5 });
  await page.mouse.up();
  await expect(area).not.toHaveAttribute("data-dragging", "true");
  const { saturation, brightness } = await areaValue(area);
  expect(Math.abs(saturation - 75)).toBeLessThanOrEqual(1);
  expect(Math.abs(brightness - 25)).toBeLessThanOrEqual(1);
});
