import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";
import { demoEntries } from "../lib/registry/demos.generated";
import { AXE_DISABLED_RULES, CONTRAST_EXEMPTIONS } from "../lib/test/axe-rules";
import { paintInkFillsAsCss } from "./ink-fills";
import { waitForInk } from "./ready";
import { comparePixels, shoot } from "./shoot";

type AxeResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;

/** Each violated rule with its nodes; a contrast failure also says its colours and ratio. */
function axeFindings(violations: AxeResults["violations"]) {
  return violations.map(({ id, nodes }) => ({
    id,
    nodes: nodes.map((node) => {
      const data = node.any[0]?.data as
        | { fgColor?: string; bgColor?: string; contrastRatio?: number }
        | undefined;
      return data?.contrastRatio
        ? `${node.target.join(" ")}: ${data.fgColor} on ${data.bgColor}, ${data.contrastRatio}:1`
        : node.target.join(" ");
    }),
  }));
}

// Every demo in the generated map, light and dark, at each project's width. Baselines are
// Linux-only (CI); elsewhere the page is loaded and checked for errors, without pixels.

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

// A combobox popup lines up with its field: the popup anchors to the whole field (outline, trigger
// and clear), not the bare <input>, so the two drawn outlines are one width (±1 px; the popup's
// heavier pen reaches a hair less far) and the popup stays inside the phone.
const COMBOBOX_FIELDS = [
  { demo: "default", field: "input-group" },
  { demo: "with-groups", field: "input-group" },
  { demo: "multiple", field: "combobox-chips" },
].filter(({ demo }) => entries.some((entry) => entry.item === "combobox" && entry.demo === demo));
for (const { demo, field } of COMBOBOX_FIELDS) {
  test(`combobox/${demo} popup is as wide as its field`, async ({ page }) => {
    await page.goto(`/demo/combobox/${demo}`);
    await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
    await waitForInk(page);
    const popup = page.locator('[data-slot="combobox-content"]');
    await expect(popup).toBeVisible();
    const drawn = (slot: string) =>
      page.evaluate((slot) => {
        const box = document.querySelector(`[data-slot="${slot}"]`);
        // The popup's frame sits on its positioner (the popup clips); the field's is its own.
        const host = slot === "combobox-content" ? box?.parentElement : box;
        const outline = host?.querySelector(':scope > [data-slot="ink-frame"] svg');
        const outer = outline?.getBoundingClientRect();
        const inner = box?.getBoundingClientRect();
        return { outer: outer?.width ?? -1, inner: inner?.width ?? -1, right: inner?.right ?? -1 };
      }, slot);
    // Positioning settles a frame or two after the fonts, so poll.
    await expect
      .poll(async () => (await drawn("combobox-content")).inner - (await drawn(field)).inner)
      .toBe(0);
    const [popupBox, fieldBox] = await Promise.all([drawn("combobox-content"), drawn(field)]);
    expect(
      Math.abs(popupBox.outer - fieldBox.outer),
      "outer widths, outlines included",
    ).toBeLessThanOrEqual(1);
    expect(popupBox.right).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
  });
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

// The reader's key-hint row (spread-viewer's help line) takes two lines on controls under 400 px,
// a phone's, Home and End on the second, and one line from a tablet up (Task 144).
if (entries.some((entry) => entry.item === "reader" && entry.demo === "default")) {
  test("reader/default key hints wrap to two lines under 400 px", async ({ page }) => {
    await page.goto("/demo/reader/default");
    await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
    const help = page.locator('[data-slot="spread-viewer-help"]');
    await expect(help).toBeVisible();
    const lines = await help.evaluate((element) => {
      const tops = [...element.children]
        .filter((child) => child.tagName === "SPAN")
        .map((child) => Math.round(child.getBoundingClientRect().top));
      const controls = element.parentElement?.getBoundingClientRect().width ?? 0;
      return { count: new Set(tops).size, controls };
    });
    expect(lines.count, `help lines on ${lines.controls} px controls`).toBe(
      lines.controls < 400 ? 2 : 1,
    );
    if (test.info().project.name === "w360") expect(lines.count).toBe(2);
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
        await shoot(page, `${item}-${demo}-${mode}.png`, { fullPage: true });
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
      // (lib/test/axe-rules.ts). Light only: apart from contrast both modes are one DOM.
      // Base UI's focus guards are excluded, as in site.spec.ts: an open select or menu
      // (select/open, the dropdown-menu demos) portals visually hidden spans with tabindex 0 and
      // aria-hidden that hand focus on at once, which aria-hidden-focus flags; Base UI 1.9 has no
      // option to drop them and its Tab order needs them. Every other node is checked.
      if (mode === "light") {
        const { violations } = await new AxeBuilder({ page })
          .disableRules(AXE_DISABLED_RULES)
          .exclude("[data-base-ui-focus-guard]")
          .analyze();
        expect(axeFindings(violations), "axe violations").toEqual([]);
      }

      // Contrast, in both modes, last: the pen's fills become CSS so axe can measure the text
      // over them (e2e/ink-fills.ts), which changes the page. Text axe cannot measure (over a
      // screentone, under an SFX outline) is reported as incomplete and is not a failure.
      await paintInkFillsAsCss(page);
      const contrast = new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .exclude("[data-base-ui-focus-guard]");
      for (const { selector } of CONTRAST_EXEMPTIONS.filter(
        (exemption) => exemption.item === item && exemption.demo === demo,
      )) {
        contrast.exclude(selector);
      }
      const { violations } = await contrast.analyze();
      expect(axeFindings(violations), "color-contrast below WCAG AA").toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
