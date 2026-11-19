import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";
import { hydrateAfterReveal, waitForInk } from "./ready";

// Lane C's own checks (SPEC-components-8 §5.4, §5.6, §8): file-manager-01 and upload-01 walked in
// a real browser at 360 and 1280. The catalog-driven ones (axe in both modes, one main, no
// overflow at 360, the shots) are e2e/blocks.spec.ts's.

const only = selectedDemoItems(parseE2eItems(process.env.E2E_ITEMS));

test.skip(({ viewport }) => viewport?.width === 768, "the lane walks 360 and 1280");

async function openView(page: Page, name: string) {
  await hydrateAfterReveal(page);
  const response = await page.goto(`/view/${name}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
  await waitForInk(page);
}

async function expectNoOverflow(page: Page) {
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width, "no horizontal overflow").toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
}

const announcer = (page: Page) => page.locator('[role="status"]').last();
const png = (name: string) => ({ name, mimeType: "image/png", buffer: Buffer.alloc(2048) });
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

test.describe("file-manager-01", () => {
  test.skip(only !== undefined && !only.includes("file-manager-01"), "E2E_ITEMS leaves it out");

  const crumbs = (page: Page) => page.getByRole("navigation", { name: /breadcrumb/i });

  /** The visible folder tree; on a phone, behind the Folders collapsible. */
  async function folders(page: Page) {
    if (isPhone(page)) {
      const toggle = page.getByRole("button", { name: "Folders" });
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await toggle.click();
    }
    return page.getByRole("tree", { name: "Folders" });
  }

  test("a folder opens from the tree by keyboard and the breadcrumb follows", async ({ page }) => {
    await openView(page, "file-manager-01");
    await expectNoOverflow(page);
    const tree = await folders(page);
    const current = tree.getByRole("treeitem", { name: "Chapter 1", selected: true });
    await current.focus();
    await page.keyboard.press("ArrowDown");
    await expect(tree.getByRole("treeitem", { name: "Chapter 2" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(crumbs(page).getByRole("listitem").last()).toHaveText("Chapter 2");
    await expect(page.getByRole("heading", { level: 2, name: "Chapter 2" })).toBeVisible();
    await expect(announcer(page)).toHaveText("Chapter 2 opened, 3 items");
  });

  test("rename in place: a duplicate is refused, Esc cancels, Enter commits", async ({ page }) => {
    await openView(page, "file-manager-01");
    const trigger = page.getByRole("button", { name: "Actions for night-train-ch01-p02.png" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("menuitem", { name: "Rename" }).click();
    const input = page.getByRole("textbox", { name: "New name for night-train-ch01-p02.png" });
    await expect(input).toBeFocused();

    await input.fill("night-train-ch01-p03.png");
    await input.press("Enter");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(announcer(page)).toHaveText("night-train-ch01-p03.png is already in this folder.");

    await input.press("Escape");
    await expect(input).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Enter");
    await page.getByRole("menuitem", { name: "Rename" }).click();
    await expect(input).toBeFocused();
    await input.fill("splash-page.png");
    await input.press("Enter");
    await expect(announcer(page)).toHaveText("night-train-ch01-p02.png renamed to splash-page.png");
    await expect(page.getByRole("button", { name: "Actions for splash-page.png" })).toBeFocused();
  });

  test("delete through the dialog; focus lands on the list", async ({ page }) => {
    await openView(page, "file-manager-01");
    await page.getByRole("button", { name: "Actions for night-train-ch01-p06.png" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Delete night-train-ch01-p06.png?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("night-train-ch01-p06.png", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "Chapter 1" })).toBeFocused();
    await expect(announcer(page)).toHaveText("night-train-ch01-p06.png deleted");
  });

  test("a file set on the input joins the open folder", async ({ page }) => {
    await openView(page, "file-manager-01");
    await page.locator('input[type="file"][name="files"]').setInputFiles(png("extra-page.png"));
    const row = page.getByRole("row").filter({ hasText: "extra-page.png" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("2 kB");
    await expectNoOverflow(page);
  });

  test("the tree is a column at 1280 and a closed Folders collapsible at 360", async ({ page }) => {
    await openView(page, "file-manager-01");
    const list = await page.getByRole("region", { name: "Chapter 1", exact: true }).boundingBox();
    if (!list) throw new Error("no layout");
    if (isPhone(page)) {
      const toggle = page.getByRole("button", { name: "Folders" });
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByRole("tree")).toHaveCount(0);
      const box = await toggle.boundingBox();
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(list.y);
      await expect(page.getByRole("columnheader", { name: "Modified" })).toBeHidden();
    } else {
      const tree = await page.getByRole("tree", { name: "Folders" }).boundingBox();
      expect((tree?.x ?? 0) + (tree?.width ?? 0)).toBeLessThanOrEqual(list.x);
      await expect(page.getByRole("columnheader", { name: "Kind" })).toBeVisible();
    }
  });
});

test.describe("upload-01", () => {
  test.skip(only !== undefined && !only.includes("upload-01"), "E2E_ITEMS leaves it out");

  const twelvePages = () =>
    Array.from({ length: 12 }, (_, index) =>
      png(index === 6 ? "ch13-p07-error.png" : `ch13-p${String(index + 1).padStart(2, "0")}.png`),
    );
  const pages = (page: Page) => page.locator('input[type="file"][name="pages"]');

  test("twelve pages upload to done, the error page retries, Publish announces", async ({
    page,
  }) => {
    await openView(page, "upload-01");
    await pages(page).setInputFiles(twelvePages());
    await expect(page.getByText("0 of 12 pages uploaded", { exact: true })).toBeVisible();
    await expectNoOverflow(page);

    await page.getByRole("button", { name: "Upload" }).click();
    await expect(page.getByText("11 of 12 pages uploaded", { exact: true })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "1 page failed" })).toBeVisible();
    const publish = page.getByRole("button", { name: "Publish" });
    await expect(publish).toBeDisabled();

    await page.getByRole("button", { name: "Retry ch13-p07-error.png" }).click();
    await expect(page.getByText("12 of 12 pages uploaded", { exact: true })).toBeVisible();
    await expect(publish).toBeEnabled();

    await publish.click();
    const title = page.getByLabel(/^Title/);
    await expect(title).toBeFocused();
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await title.fill("The last stop");
    await publish.click();
    await expect(announcer(page)).toHaveText("Chapter 13 published");
  });

  test("Cancel stops the upload", async ({ page }) => {
    await openView(page, "upload-01");
    await pages(page).setInputFiles(twelvePages());
    await page.getByRole("button", { name: "Upload" }).click();
    const cancel = page.getByRole("button", { name: "Cancel" });
    await cancel.click();
    await expect(announcer(page)).toHaveText("Upload cancelled");
    await expect(cancel).toBeDisabled();
    // Three ticks of the form's timer (300 ms each) on purpose: nothing may move once cancelled.
    await page.waitForTimeout(1000);
    await expect(page.getByText("0 of 12 pages uploaded", { exact: true })).toBeVisible();
    await expect(page.locator('[data-slot="file-upload-item"][data-status="idle"]')).toHaveCount(
      12,
    );
  });

  test("a non-image and a page over 10 MB are listed with their reasons", async ({ page }) => {
    await openView(page, "upload-01");
    await pages(page).setInputFiles([
      { name: "script.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(10) },
      { name: "poster.png", mimeType: "image/png", buffer: Buffer.alloc(11 * 1024 * 1024) },
    ]);
    const rejected = page.locator('[data-slot="file-upload-item"][data-status="error"]');
    await expect(rejected.filter({ hasText: "script.pdf" })).toContainText(
      "not an accepted file type",
    );
    await expect(rejected.filter({ hasText: "poster.png" })).toContainText("larger than 10 MB");
  });
});
