import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";
import { demoEntries } from "../lib/registry/demos.generated";
import { AXE_DISABLED_RULES } from "../lib/test/axe-rules";
import { waitForInk } from "./ready";

// Every demo in the generated map, light and dark, at each project's width. Baselines are
// Linux-only (CI); elsewhere the page is loaded and checked for errors, without pixels.
const comparePixels = process.platform === "linux";

// Toasts fired on mount by the sonner demos; the snapshot waits until all of them are shown.
const TOASTS_ON_MOUNT: Record<string, number> = {
  "sonner/default": 1,
  "sonner/kinds": 4,
  "sonner/with-action": 1,
};

// `E2E_ITEMS` (playwright.config.ts) keeps only the named items' demos; a name with no demos is
// an error, so a typo never passes by running nothing.
const only = selectedDemoItems(parseE2eItems(process.env.E2E_ITEMS));
const unknown = only?.filter((name) => !demoEntries.some((entry) => entry.item === name)) ?? [];
if (unknown.length > 0)
  throw new Error(`E2E_ITEMS names items without demos: ${unknown.join(", ")}`);
const entries = only ? demoEntries.filter((entry) => only.includes(entry.item)) : demoEntries;

// A panel does not clip, and focus lines start past their box: the layer clips them itself. The
// dogfood run found a page 36 px too wide at 375 px. With the stage's padding gone the panel
// meets both edges of a phone; its own ink frame reaches a few px past them, so the check is
// that the layer adds nothing: the page is as wide with it as without it, and the layer stays
// inside the panel.
if (entries.some((entry) => entry.item === "focus-lines" && entry.demo === "in-a-panel")) {
  test("focus-lines in a panel adds no horizontal overflow at 360 px", async ({ page }) => {
    test.skip(test.info().project.name !== "w360", "one phone width is enough");
    await page.goto("/demo/focus-lines/in-a-panel");
    await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
    await waitForInk(page);
    await page.locator('[data-slot="demo-stage"]').evaluate((stage) => {
      (stage as HTMLElement).style.padding = "0";
    });
    const panel = page.locator('[data-slot="panel"]');
    const layer = panel.locator(':scope > [data-slot="focus-lines"]');
    await expect(layer).toHaveCSS("overflow", "hidden");
    const [panelBox, layerBox] = await Promise.all([panel.boundingBox(), layer.boundingBox()]);
    expect(panelBox?.width, "the panel spans the phone").toBe(360);
    expect(layerBox && panelBox && layerBox.x >= panelBox.x).toBe(true);
    expect(layerBox && panelBox && layerBox.x + layerBox.width <= panelBox.x + panelBox.width).toBe(
      true,
    );
    const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);
    const withLines = await scrollWidth();
    await layer.evaluate((node) => {
      (node as HTMLElement).style.display = "none";
    });
    expect(withLines, "the focus lines widen the page").toBe(await scrollWidth());
  });
}

// Popups pass `collisionPadding={8}` to their positioner: a popup's ink frame reaches past its
// box, so near the viewport's edge the popup keeps 8 px of room instead of meeting it. Each
// trigger is pushed to one edge of a phone (the stage's centring and padding dropped before the
// page runs), and the open popup must stay 8 px inside both edges.
const EDGE_POPUPS = [
  { item: "popover", demo: "default", popup: "popover-content" },
  { item: "select", demo: "open", popup: "select-content" },
  { item: "tooltip", demo: "default", popup: "tooltip-content" },
].filter(({ item, demo }) => entries.some((entry) => entry.item === item && entry.demo === demo));
for (const { item, demo, popup } of EDGE_POPUPS) {
  for (const edge of ["flex-start", "flex-end"] as const) {
    test(`${item}/${demo} keeps 8 px from the viewport edge at 360 px (${edge})`, async ({
      page,
    }) => {
      test.skip(test.info().project.name !== "w360", "one phone width is enough");
      await page.addInitScript((justify) => {
        document.addEventListener("DOMContentLoaded", () => {
          const style = document.createElement("style");
          style.textContent = `[data-slot="demo-stage"] { justify-content: ${justify} !important; padding: 0 !important; }`;
          document.head.append(style);
        });
      }, edge);
      await page.goto(`/demo/${item}/${demo}`);
      await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
      await waitForInk(page);
      const width = page.viewportSize()?.width ?? 0;
      const box = page.locator(`[data-slot="${popup}"]`);
      await expect(box).toBeVisible();
      // The room on the nearer side; positioning settles a frame or two after the fonts, so poll.
      await expect
        .poll(
          async () => {
            const rect = await box.boundingBox();
            return rect ? Math.min(rect.x, width - (rect.x + rect.width)) : -1;
          },
          { message: "room between the popup and the viewport's nearer edge" },
        )
        .toBeGreaterThanOrEqual(7.5);
    });
  }
}

// The spread viewer pages in reading order from the keyboard and the buttons, at a phone and a
// desktop width: the arrow pointing the way the book reads is next (Left in rtl, Right in ltr),
// Home and End go to the ends, the buttons stop there, and the live region says where.
const SPREADS = [
  { demo: "default", next: "ArrowLeft", previous: "ArrowRight", later: "left" },
  { demo: "ltr", next: "ArrowRight", previous: "ArrowLeft", later: "right" },
].filter(({ demo }) =>
  entries.some((entry) => entry.item === "spread-viewer" && entry.demo === demo),
);
for (const { demo, next, previous, later } of SPREADS) {
  test(`spread-viewer/${demo} pages in reading order from the keys and the buttons`, async ({
    page,
  }) => {
    test.skip(test.info().project.name === "w768", "a phone and a desktop width are enough");
    await page.goto(`/demo/spread-viewer/${demo}`);
    await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
    const region = page.locator('[data-slot="spread-viewer"]');
    await expect(region).toHaveAttribute("role", "region");
    await expect(region).toHaveAttribute("aria-roledescription", "spread");
    const status = region.locator('[data-slot="spread-viewer-status"]');
    const laterPage = region.locator(`[data-slot="spread-viewer-page"][data-side="${later}"] img`);
    const nextButton = region.getByRole("button", { name: "Next" });
    const previousButton = region.getByRole("button", { name: "Previous" });
    await expect(status).toHaveText("Pages 4–5 of 24");

    await region.focus();
    await page.keyboard.press(next);
    await expect(status).toHaveText("Pages 6–7 of 24");
    // The later page of the pair sits on the side the book reads towards (the old one has left).
    await expect(laterPage).toHaveCount(1);
    await expect(laterPage).toHaveAttribute("alt", /^Page 7:/);
    await page.keyboard.press(previous);
    await expect(status).toHaveText("Pages 4–5 of 24");
    await page.keyboard.press("End");
    await expect(status).toHaveText("Page 24 of 24");
    await expect(nextButton).toBeDisabled();
    await page.keyboard.press("Home");
    await expect(status).toHaveText("Page 1 of 24");
    await expect(previousButton).toBeDisabled();

    await nextButton.click();
    await expect(status).toHaveText("Pages 2–3 of 24");
    await previousButton.click();
    await expect(status).toHaveText("Page 1 of 24");
  });
}

for (const { item, demo } of entries) {
  for (const mode of ["light", "dark"] as const) {
    test(`${item}/${demo} (${mode})`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      const query = mode === "dark" ? "?mode=dark" : "";
      const response = await page.goto(`/demo/${item}/${demo}${query}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
      if (mode === "dark") await expect(page.locator("html")).toHaveClass(/\bdark\b/);
      const toasts = TOASTS_ON_MOUNT[`${item}/${demo}`];
      if (toasts) {
        await expect(page.locator('[data-sonner-toast][data-mounted="true"]')).toHaveCount(toasts);
      }
      await waitForInk(page);

      if (comparePixels) {
        await expect(page).toHaveScreenshot(`${item}-${demo}-${mode}.png`, { fullPage: true });
      }

      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, "no horizontal overflow").toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
      // A table scrolls only as far as the table itself: drawings past its edges (row rules
      // reach 8 px out) must not give a table that fits a scrollbar.
      const tables = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[data-slot="table-container"]')].map(
          (container) => ({
            scroll: container.scrollWidth,
            fits: Math.max(
              container.clientWidth,
              container.querySelector("table")?.offsetWidth ?? 0,
            ),
          }),
        ),
      );
      for (const { scroll, fits } of tables) {
        expect(scroll, "table container overflow").toBeLessThanOrEqual(fits);
      }

      // The stage page as the gallery iframes it, drawn, with the unit tests' rule set
      // (lib/test/axe-rules.ts). Light only: with color-contrast off both modes are one DOM.
      // Base UI's focus guards are excluded, as in site.spec.ts: an open select or menu
      // (select/open, the dropdown-menu demos) portals visually hidden spans with tabindex 0 and
      // aria-hidden that hand focus on at once, which aria-hidden-focus flags; Base UI 1.9 has no
      // option to drop them and its Tab order needs them. Every other node is checked.
      if (mode === "light") {
        const { violations } = await new AxeBuilder({ page })
          .disableRules(AXE_DISABLED_RULES)
          .exclude("[data-base-ui-focus-guard]")
          .analyze();
        const found = violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map((node) => node.target),
        }));
        expect(found, "axe violations").toEqual([]);
      }
      expect(errors).toEqual([]);
    });
  }
}
