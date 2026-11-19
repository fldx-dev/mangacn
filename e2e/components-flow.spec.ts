import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";
import { waitForInk } from "./ready";

// Lane D's browser-only checks (SPEC-components-7 §5): file-upload takes files through the native
// input and a synthetic drop, rejects a too-large file with its reason and posts with a form;
// stepper's horizontal titles under 768 px; timeline's alternate sides from 768 px. Axe, overflow
// and the shots are e2e/demos.spec.ts's.

const only = selectedDemoItems(parseE2eItems(process.env.E2E_ITEMS));
const skipUnless = (item: string) =>
  test.skip(only !== undefined && !only.includes(item), "E2E_ITEMS leaves it out");

async function openDemo(page: Page, item: string, demo: string) {
  const response = await page.goto(`/demo/${item}/${demo}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
  await waitForInk(page);
}

const png = (name: string, bytes: number) => ({
  name,
  mimeType: "image/png",
  buffer: Buffer.alloc(bytes),
});

test.describe("file-upload", () => {
  skipUnless("file-upload");

  test("setInputFiles adds files; a too-large file and another type are rejected", async ({
    page,
  }) => {
    await openDemo(page, "file-upload", "default");
    const input = page.locator('input[type="file"]');
    await input.setInputFiles([
      png("page-01.png", 2048),
      png("page-02.png", 4096),
      png("huge-spread.png", 6 * 1024 * 1024),
      { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hi") },
    ]);
    const rows = page.locator('[data-slot="file-upload-item"]');
    await expect(rows).toHaveCount(4);
    await expect(rows.filter({ hasText: "page-01.png" })).toHaveAttribute("data-status", "idle");
    const big = rows.filter({ hasText: "huge-spread.png" });
    await expect(big).toHaveAttribute("data-status", "error");
    await expect(big).toContainText(/larger than 5\s?MB/i);
    await expect(rows.filter({ hasText: "notes.txt" })).toContainText("not an accepted file type");
    await expect(page.locator('[aria-live="polite"]')).toHaveText(
      /^2 files added\. huge-spread\.png was not added: larger than 5\s?MB\. notes\.txt was not added: not an accepted file type$/i,
    );
    // Size and remove stay on the row's first line at every width.
    const row = rows.first();
    const name = await row.locator('[data-slot="file-upload-item-name"]').boundingBox();
    const remove = await row.locator('[data-slot="file-upload-item-remove"]').boundingBox();
    expect(
      name && remove && Math.abs(name.y + name.height / 2 - (remove.y + remove.height / 2)),
    ).toBeLessThan(4);
    await row.getByRole("button", { name: "Remove page-01.png" }).click();
    await expect(rows.filter({ hasText: "page-01.png" })).toHaveCount(0);
  });

  test("a synthetic drop adds files and marks the zone while dragging", async ({ page }) => {
    await openDemo(page, "file-upload", "default");
    const zone = page.locator('[data-slot="file-upload-dropzone"]');
    const transfer = await page.evaluateHandle(() => {
      const data = new DataTransfer();
      data.items.add(new File([new Uint8Array(1024)], "dropped.png", { type: "image/png" }));
      return data;
    });
    await zone.dispatchEvent("dragenter", { dataTransfer: transfer });
    await expect(zone).toHaveAttribute("data-dragging", "");
    await zone.dispatchEvent("dragover", { dataTransfer: transfer });
    await zone.dispatchEvent("drop", { dataTransfer: transfer });
    await expect(zone).not.toHaveAttribute("data-dragging", "");
    await expect(page.locator('[data-slot="file-upload-item"]')).toContainText("dropped.png");
    await expect(page.locator('[aria-live="polite"]')).toHaveText("1 file added");
  });

  test("one file replaces the other and posts with the form", async ({ page }) => {
    await openDemo(page, "file-upload", "avatar");
    const input = page.locator('input[type="file"][name="avatar"]');
    await input.setInputFiles(png("old.png", 1024));
    await input.setInputFiles(png("new.png", 1024));
    await expect(page.locator('[data-slot="file-upload-item"]')).toHaveCount(1);
    await expect(page.locator('[data-slot="file-upload-item"]')).toContainText("new.png");
    const posted = await page
      .locator("form")
      .evaluate((form: HTMLFormElement) =>
        new FormData(form).getAll("avatar").map((value) => (value as File).name),
      );
    expect(posted).toEqual(["new.png"]);
  });

  test("a rejected choice leaves the form posting the kept file, not the rejected one", async ({
    page,
  }) => {
    await openDemo(page, "file-upload", "avatar");
    const input = page.locator('input[type="file"][name="avatar"]');
    await input.setInputFiles(png("kept.png", 1024));
    await input.setInputFiles(png("too-big.png", 2 * 1024 * 1024));
    const rows = page.locator('[data-slot="file-upload-item"]');
    await expect(rows.filter({ hasText: "too-big.png" })).toHaveAttribute("data-status", "error");
    await expect(rows.filter({ hasText: "kept.png" })).toHaveAttribute("data-status", "idle");
    const posted = () =>
      page
        .locator("form")
        .evaluate((form: HTMLFormElement) =>
          new FormData(form).getAll("avatar").map((value) => (value as File).name),
        );
    expect(await posted()).toEqual(["kept.png"]);
    // The same rejected file again still fires a change (the input no longer holds it).
    await input.setInputFiles(png("too-big.png", 2 * 1024 * 1024));
    expect(await posted()).toEqual(["kept.png"]);
    // Removing the kept file empties the input; an empty file input posts one nameless entry.
    await page.getByRole("button", { name: "Remove kept.png" }).click();
    expect(await posted()).toEqual([""]);
  });
});

test.describe("stepper", () => {
  skipUnless("stepper");

  test("horizontal shows only the current title under 768 px, every title from 768", async ({
    page,
  }) => {
    await openDemo(page, "stepper", "default");
    const width = page.viewportSize()?.width ?? 0;
    const titles = page.locator('[data-slot="stepper-title"]');
    await expect(titles).toHaveCount(4);
    const visible = await titles.evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 1 && box.height > 1;
      }),
    );
    expect(visible).toEqual(width < 768 ? [false, false, true, false] : [true, true, true, true]);
    // The hidden titles are still in each step's name.
    await expect(
      page.getByRole("button", { name: /Step 1 of 4: Cart.*, completed$/ }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Payment.*, error$/ })).toBeVisible();
    const descriptions = page.locator('[data-slot="stepper-description"]');
    const shown = await descriptions.first().evaluate((element) => element.clientWidth > 1);
    expect(shown).toBe(width >= 768);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });

  test("the vertical wizard moves with Next and Back and by choosing a step", async ({ page }) => {
    await openDemo(page, "stepper", "vertical");
    const items = page.locator('[data-slot="stepper-item"]');
    await expect(items.nth(1)).toHaveAttribute("aria-current", "step");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(items.nth(2)).toHaveAttribute("aria-current", "step");
    await page.getByRole("button", { name: /Series details.*, completed$/ }).click();
    await expect(items.nth(0)).toHaveAttribute("aria-current", "step");
    await expect(page.getByRole("button", { name: "Back" })).toBeDisabled();
  });
});

test.describe("timeline", () => {
  skipUnless("timeline");

  test("alternate switches sides from 768 px and keeps one side below", async ({ page }) => {
    await openDemo(page, "timeline", "alternate");
    const width = page.viewportSize()?.width ?? 0;
    const sides = await page.locator('[data-slot="timeline-item"]').evaluateAll((items) =>
      items.map((item) => {
        const dot = item.querySelector('[data-slot="timeline-indicator"]')?.getBoundingClientRect();
        const content = item
          .querySelector('[data-slot="timeline-content"]')
          ?.getBoundingClientRect();
        return dot && content && content.left < dot.left ? "left" : "right";
      }),
    );
    expect(sides).toEqual(
      width < 768 ? ["right", "right", "right", "right"] : ["right", "left", "right", "left"],
    );
    await expect(page.locator('[aria-current="true"]')).toContainText("Inking and colour");
  });
});
