import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";
import { waitForInk } from "./ready";

// Group C's browser-only checks (SPEC-components-9 §8), one describe per lane. The
// catalog-driven checks (axe in both modes, no overflow at every width, the shots) are
// e2e/demos.spec.ts's.

const only = selectedDemoItems(parseE2eItems(process.env.E2E_ITEMS));

async function openDemo(page: Page, item: string, demo: string) {
  const response = await page.goto(`/demo/${item}/${demo}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
  await waitForInk(page);
}

test.describe("phone-input", () => {
  test.skip(only !== undefined && !only.includes("phone-input"), "E2E_ITEMS leaves it out");

  const phone = (page: Page) => page.getByRole("textbox", { name: "Phone" });
  const country = (page: Page) => page.locator('[data-slot="phone-input-country"]');

  test("a pasted +81 3-1234-5678 picks Japan and reads the national way", async ({
    page,
    context,
  }) => {
    // The system clipboard is one per browser: one width, so no two tests write it at once.
    test.skip(test.info().project.name !== "w1280", "one width is enough");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openDemo(page, "phone-input", "countries");
    const input = page.getByRole("textbox", { name: "Studio phone" });
    await input.fill("");
    await expect(country(page)).toHaveAccessibleName("Country: France, FR +33");
    await page.evaluate(() => navigator.clipboard.writeText("+81 3-1234-5678"));
    await input.focus();
    await page.keyboard.press("ControlOrMeta+V");
    await expect(country(page)).toHaveAccessibleName("Country: Japan, JP +81");
    await expect(input).toHaveValue("03-1234-5678");
  });

  test("picking another country from the keyboard keeps the digits", async ({ page }) => {
    await openDemo(page, "phone-input", "default");
    await phone(page).pressSequentially("0312345678");
    await expect(phone(page)).toHaveValue("03-1234-5678");
    await country(page).focus();
    await page.keyboard.press("Enter");
    const searchBox = page.getByRole("combobox", { name: "Search countries" });
    await expect(searchBox).toBeFocused();
    await searchBox.pressSequentially("+82");
    await expect(page.getByRole("option")).toHaveText(["KR South Korea +82"]);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(country(page)).toHaveAccessibleName(/^Country: South Korea, KR/);
    await expect(country(page)).toBeFocused();
    // The same digits, formatted the Korean way.
    await expect(phone(page)).toHaveValue("031-234-5678");
    await expect(phone(page)).toHaveAccessibleDescription(/South Korea, \+82/);
  });

  test("an incomplete number is invalid only after blur", async ({ page }) => {
    await openDemo(page, "phone-input", "default");
    await phone(page).pressSequentially("0312");
    await expect(phone(page)).toHaveValue("03-12");
    await expect(phone(page)).not.toHaveAttribute("aria-invalid");
    await page.keyboard.press("Tab");
    await expect(phone(page)).toHaveAttribute("aria-invalid", "true");
    // Typing again clears it until the next blur.
    await phone(page).press("End");
    await phone(page).pressSequentially("345678");
    await expect(phone(page)).not.toHaveAttribute("aria-invalid");
    await page.keyboard.press("Tab");
    await expect(phone(page)).not.toHaveAttribute("aria-invalid");
  });

  test("the form posts the number in E.164", async ({ page }) => {
    await openDemo(page, "phone-input", "form");
    const input = page.getByRole("textbox", { name: "Phone for delivery" });
    const save = page.getByRole("button", { name: "Save" });
    await save.click();
    await expect(page.locator('[data-slot="field-error"]')).toHaveText("Enter a phone number.");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await input.pressSequentially("090-1234-5678");
    await expect(input).toHaveValue("090-1234-5678");
    await save.click();
    await expect(page.getByRole("status")).toHaveText("Sent +819012345678.");
    expect(
      await page.evaluate(() => [...new FormData(document.querySelector("form") ?? undefined)]),
    ).toEqual([["phone", "+819012345678"]]);
  });

  test("at 360 the trigger shows the ISO code alone, the list opens as wide as the field and nothing overflows", async ({
    page,
  }) => {
    test.skip(test.info().project.name !== "w360", "the phone width");
    for (const demo of ["default", "countries", "form"]) {
      await openDemo(page, "phone-input", demo);
      await expect(country(page)).toHaveText(/^[A-Z]{2}$/, { useInnerText: true });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, demo).toBeLessThanOrEqual(0);
    }
    await openDemo(page, "phone-input", "default");
    await country(page).click();
    const popup = page.locator('[data-slot="combobox-content"]');
    await expect(popup).toBeVisible();
    const field = await page
      .locator('[data-slot="phone-input"] [data-slot="input-group"]')
      .first()
      .boundingBox();
    const list = await popup.boundingBox();
    expect(Math.abs((list?.width ?? 0) - (field?.width ?? 0))).toBeLessThanOrEqual(1);
    expect(list?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((list?.x ?? 0) + (list?.width ?? 0)).toBeLessThanOrEqual(360);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
