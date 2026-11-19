import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";
import { hydrateAfterReveal, waitForInk } from "./ready";

// Lane A's own checks (SPEC-components-8 §5.1, §5.2, §8): settings-01 and profile-01 walked in a
// real browser at 360 and 1280. The catalog-driven ones (axe in both modes, one main, no
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

test.describe("settings-01", () => {
  test.skip(only !== undefined && !only.includes("settings-01"), "E2E_ITEMS leaves it out");

  test("Save with an empty display name focuses it; a valid Save by Enter announces", async ({
    page,
  }) => {
    await openView(page, "settings-01");
    await expectNoOverflow(page);
    const name = page.getByLabel(/Display name/);
    await name.fill("");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("form", { name: "Settings" }).getByRole("alert")).toContainText(
      "Enter a display name.",
    );

    await name.fill("Aiko T.");
    await name.press("Enter");
    await expect(announcer(page)).toHaveText("Settings saved");
    await expect(name).not.toHaveAttribute("aria-invalid", "true");
  });

  test("a nav link moves focus to its section's heading", async ({ page }) => {
    await openView(page, "settings-01");
    const nav = page.getByRole("navigation", { name: "Settings sections" });
    await nav.getByRole("link", { name: "Notifications" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeFocused();
  });

  test("the delete dialog opens, and Escape returns focus to its button", async ({ page }) => {
    await openView(page, "settings-01");
    const trigger = page.getByRole("button", { name: "Delete account" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("alertdialog", { name: "Delete your account?" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await dialog.getByRole("button", { name: "Delete account" }).click();
    await expect(dialog).toBeHidden();
    await expect(announcer(page)).toHaveText("Account deletion requested");
  });

  test("the section nav sticks beside the sections at 1280 and wraps above at 360", async ({
    page,
  }, testInfo) => {
    await openView(page, "settings-01");
    const nav = await page.getByRole("navigation", { name: "Settings sections" }).boundingBox();
    const account = await page.getByRole("region", { name: "Account" }).boundingBox();
    if (!nav || !account) throw new Error("no layout");
    if (testInfo.project.name === "w1280") {
      expect(nav.x + nav.width).toBeLessThanOrEqual(account.x);
    } else {
      expect(nav.y + nav.height).toBeLessThanOrEqual(account.y);
    }
  });
});

test.describe("profile-01", () => {
  test.skip(only !== undefined && !only.includes("profile-01"), "E2E_ITEMS leaves it out");

  test("a 3 MB image is rejected with its reason; a small one previews", async ({ page }) => {
    await openView(page, "profile-01");
    await expectNoOverflow(page);
    const input = page.locator('input[type="file"][name="photo"]');
    await input.setInputFiles({
      name: "poster.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(3 * 1024 * 1024),
    });
    await expect(page.getByText(/poster\.png is larger than 2 MB/)).toBeVisible();

    // A 1×1 PNG.
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );
    await input.setInputFiles({ name: "me.png", mimeType: "image/png", buffer: png });
    await expect(page.getByText(/is larger than 2 MB/)).toHaveCount(0);
    await expect(page.getByRole("img", { name: "Your new photo" })).toHaveAttribute(
      "src",
      /^blob:/,
    );
  });

  test("Change photo opens the native dialog by keyboard", async ({ page }) => {
    await openView(page, "profile-01");
    await page.getByRole("button", { name: "Change photo" }).focus();
    const chooser = page.waitForEvent("filechooser");
    await page.keyboard.press("Enter");
    expect((await chooser).isMultiple()).toBe(false);
  });

  test("a weak new password is refused", async ({ page }) => {
    await openView(page, "profile-01");
    await page.getByLabel(/Current password/).fill("old-secret");
    const next = page.getByLabel(/^New password/);
    await next.fill("abc");
    await page.getByLabel(/Confirm new password/).fill("abc");
    await page.getByRole("button", { name: "Save password" }).click();
    await expect(next).toBeFocused();
    await expect(next).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(/Choose a stronger password/)).toBeVisible();
  });

  test('the tags field takes "a, b" pasted', async ({ page }) => {
    await openView(page, "profile-01");
    const field = page.getByLabel("Interests");
    await field.focus();
    await field.evaluate((element) => {
      const data = new DataTransfer();
      data.setData("text/plain", "a, b");
      element.dispatchEvent(
        new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
      );
    });
    const tags = page.locator('input[name="interests"]');
    await expect(tags).toHaveCount(5);
    await expect(tags.nth(3)).toHaveValue("a");
    await expect(tags.nth(4)).toHaveValue("b");
  });

  test("the avatar sits above the fields at 360 and beside the name from 768", async ({
    page,
  }, testInfo) => {
    await openView(page, "profile-01");
    const avatar = await page.locator('[data-slot="avatar"]').boundingBox();
    const name = await page.getByLabel(/Display name/).boundingBox();
    if (!avatar || !name) throw new Error("no layout");
    if (testInfo.project.name === "w1280") expect(avatar.x + avatar.width).toBeLessThan(name.x);
    else expect(avatar.y + avatar.height).toBeLessThan(name.y);
  });
});
