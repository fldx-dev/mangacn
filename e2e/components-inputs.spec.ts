import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedVariantItems } from "../lib/e2e-filter";
import { waitForInk } from "./ready";

// Lane B's browser-only checks (SPEC-components-7 §5): copy-button against the real Clipboard API
// with the permission granted, and a real paste into tags-input. The catalog-driven checks (axe
// in both modes, no overflow at 360, the shots) are e2e/variants.spec.ts's.

const only = selectedVariantItems(parseE2eItems(process.env.E2E_ITEMS));

async function openVariant(page: Page, item: string, variant: string) {
  const response = await page.goto(`/gallery/${item}/${variant}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-variant-ready", "true");
  await waitForInk(page);
}

test.describe("copy-button", () => {
  test.skip(only !== undefined && !only.includes("copy-button"), "E2E_ITEMS leaves it out");
  test("copies its value to the clipboard with a click and with the keyboard", async ({
    page,
    context,
  }) => {
    // The system clipboard is one per browser: one width, so no two tests write it at once.
    test.skip(test.info().project.name !== "w1280", "one width is enough");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openVariant(page, "copy-button", "default");
    const button = page.getByRole("button", { name: "Copy" });
    await button.click();
    await expect(page.getByRole("button", { name: "Copied" })).toHaveAttribute(
      "data-state",
      "copied",
    );
    await expect(page.getByRole("status")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "https://www.mangacn.com/r/copy-button.json",
    );

    // Back to idle after the timeout, then Enter copies again.
    await expect(page.getByRole("button", { name: "Copy" })).toBeVisible({ timeout: 5000 });
    await page.evaluate(() => navigator.clipboard.writeText(""));
    await page.getByRole("button", { name: "Copy" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "https://www.mangacn.com/r/copy-button.json",
    );
  });
});

test.describe("tags-input", () => {
  test.skip(only !== undefined && !only.includes("tags-input"), "E2E_ITEMS leaves it out");

  test('splits a pasted "a, b, c" into three tags and announces them', async ({ page }) => {
    await openVariant(page, "tags-input", "default");
    const input = page.getByRole("textbox", { name: "Genres" });
    await input.focus();
    await input.evaluate((element) => {
      const data = new DataTransfer();
      data.setData("text/plain", "a, b, c");
      element.dispatchEvent(
        new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
      );
    });
    const tags = page.locator('[data-slot="tags-input-tag"]');
    await expect(tags).toHaveText(["Action", "Mystery", "Slice of life", "a", "b", "c"]);
    await expect(input).toHaveValue("");
    await expect(page.getByRole("status")).toHaveText("a added. b added. c added");
    await expect(page.getByRole("button", { name: "Remove c" })).toBeVisible();

    // Backspace in the empty input takes the last one off again.
    await page.keyboard.press("Backspace");
    await expect(tags).toHaveCount(5);
    await expect(page.getByRole("status")).toHaveText("c removed");
  });
});
