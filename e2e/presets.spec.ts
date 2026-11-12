import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import {
  PRESET_ATTRIBUTE,
  PRESET_STORAGE_KEY,
  THEME_LOOKS,
  type ThemeLook,
} from "../lib/registry/theme-presets";
import { AXE_DISABLED_RULES } from "../lib/test/axe-rules";
import themeCatalog from "../registry/theme/registry.json";
import { paintInkFillsAsCss } from "./ink-fills";
import { waitForInk } from "./ready";

// Theme presets (Task 99): the theme specimen stage in every look and mode at each project's
// width, with the stage suite's waits and checks, and the Theming page's switch. Pixels on Linux
// only (CI); everywhere the look is applied, nothing overflows and axe passes, contrast included.
const comparePixels = process.platform === "linux";

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

/** The `--paper` a look sets in a mode, read from the catalog the site is built from. */
function paperOf(look: ThemeLook, mode: "light" | "dark"): string {
  const name = look === "default" ? "theme" : `theme-${look}`;
  const item = themeCatalog.items.find((entry) => entry.name === name) as
    | { cssVars?: Record<string, Record<string, string>> }
    | undefined;
  const paper = item?.cssVars?.[mode]?.paper;
  if (!paper) throw new Error(`No --paper for ${name} (${mode}); run pnpm gen:theme`);
  return paper;
}

function specimenUrl(look: ThemeLook, mode: "light" | "dark"): string {
  const search = new URLSearchParams();
  if (look !== "default") search.set("theme", look);
  if (mode === "dark") search.set("mode", "dark");
  const query = search.toString();
  return `/demo/theme/specimen${query ? `?${query}` : ""}`;
}

/**
 * Whether `<html>`'s `--paper` is `expected`. Compared as painted sRGB pixels: the build rewrites
 * `oklch()` (lightningcss emits `lab()`), so the strings differ while the colour is the same.
 */
async function expectRootPaper(page: Page, expected: string) {
  const [actual, wanted] = await page.evaluate((colour) => {
    const context = document.createElement("canvas").getContext("2d");
    const pixel = (value: string) => {
      if (!context) return [];
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const paper = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim();
    return [pixel(paper), pixel(colour)];
  }, expected);
  expect(wanted, "the expected colour paints").toHaveLength(3);
  actual.forEach((channel, index) => {
    expect(Math.abs(channel - wanted[index]), `--paper is ${expected}`).toBeLessThanOrEqual(1);
  });
}

for (const look of THEME_LOOKS) {
  for (const mode of ["light", "dark"] as const) {
    test(`specimen: ${look} (${mode})`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      const response = await page.goto(specimenUrl(look, mode));
      expect(response?.status()).toBe(200);
      const html = page.locator("html");
      await expect(html).toHaveAttribute("data-demo-ready", "true");
      if (look === "default") await expect(html).not.toHaveAttribute(PRESET_ATTRIBUTE);
      else await expect(html).toHaveAttribute(PRESET_ATTRIBUTE, look);
      if (mode === "dark") await expect(html).toHaveClass(/\bdark\b/);
      await expectRootPaper(page, paperOf(look, mode));
      await waitForInk(page);

      if (comparePixels) {
        await expect(page).toHaveScreenshot(`presets-${look}-${mode}.png`, { fullPage: true });
      }

      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, "no horizontal overflow").toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);

      // The unit tests' rule set, as on every stage: light only, where apart from contrast both
      // modes are one DOM. Base UI's focus guards are excluded, as in demos.spec.ts.
      if (mode === "light") {
        const { violations } = await new AxeBuilder({ page })
          .disableRules(AXE_DISABLED_RULES)
          .exclude("[data-base-ui-focus-guard]")
          .analyze();
        expect(axeFindings(violations), "axe violations").toEqual([]);
      }

      // Contrast in both modes, last: the pen's fills become CSS so axe can measure the text
      // over them (e2e/ink-fills.ts), which changes the page.
      await paintInkFillsAsCss(page);
      const { violations } = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .exclude("[data-base-ui-focus-guard]")
        .analyze();
      expect(axeFindings(violations), "color-contrast below WCAG AA").toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

test("the Theming page's switch shows, keeps and installs a preset", async ({ page }) => {
  test.skip(test.info().project.name === "w768", "a phone and a desktop width are enough");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Whether the stored preset is on <html> before the docs page's content is parsed: the
  // observer's callback runs at the microtask checkpoint right after the inline script. It
  // watches the document, since <html> does not exist yet when an init script runs.
  await page.addInitScript((attribute) => {
    const record = window as unknown as { presetBeforeContent?: boolean };
    new MutationObserver(() => {
      if (record.presetBeforeContent !== undefined) return;
      if (document.documentElement.hasAttribute(attribute)) {
        record.presetBeforeContent = document.querySelector("article") === null;
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: [attribute] });
  }, PRESET_ATTRIBUTE);

  await page.goto("/docs/theming");
  const html = page.locator("html");
  const group = page.getByRole("group", { name: "Theme preset" });
  const command = page.locator('[data-slot="theme-presets-command"]');
  await expect(group.getByRole("radio", { name: "Default" })).toBeChecked();
  await expect(html).not.toHaveAttribute(PRESET_ATTRIBUTE);
  await expect(command).toContainText("@mangacn/theme --yes --overwrite");

  // From the keyboard: Tab lands on the checked radio, an arrow chooses the next look.
  await group.getByRole("radio", { name: "Default" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(group.getByRole("radio", { name: "Sepia" })).toBeChecked();
  await expect(html).toHaveAttribute(PRESET_ATTRIBUTE, "sepia");
  await expect(command).toContainText("@mangacn/theme-sepia --yes --overwrite");
  await expectRootPaper(page, paperOf("sepia", "light"));
  expect(await page.evaluate((key) => localStorage.getItem(key), PRESET_STORAGE_KEY)).toBe("sepia");
  const { violations } = await new AxeBuilder({ page })
    .include('[data-slot="theme-presets"]')
    .disableRules(AXE_DISABLED_RULES)
    .analyze();
  expect(axeFindings(violations), "axe violations in the switch").toEqual([]);

  // Kept across docs pages, set before the content is parsed (no flash of the default look).
  await page.goto("/docs/installation");
  await expect(html).toHaveAttribute(PRESET_ATTRIBUTE, "sepia");
  expect(
    await page.evaluate(
      () => (window as unknown as { presetBeforeContent?: boolean }).presetBeforeContent,
    ),
  ).toBe(true);
  await expectRootPaper(page, paperOf("sepia", "light"));

  // The landing keeps the default look.
  await page.goto("/");
  await expect(html).not.toHaveAttribute(PRESET_ATTRIBUTE);

  // Back to the default: the attribute and the stored choice go.
  await page.goto("/docs/theming");
  await expect(group.getByRole("radio", { name: "Sepia" })).toBeChecked();
  await group.getByText("Default").click();
  await expect(html).not.toHaveAttribute(PRESET_ATTRIBUTE);
  expect(await page.evaluate((key) => localStorage.getItem(key), PRESET_STORAGE_KEY)).toBeNull();
  expect(errors).toEqual([]);
});

test("a docs page survives storage that throws", async ({ page }) => {
  test.skip(test.info().project.name !== "w360", "one width is enough");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  await page.goto("/docs/theming");
  const group = page.getByRole("group", { name: "Theme preset" });
  await group.getByText("Sepia").click();
  await expect(page.locator("html")).toHaveAttribute(PRESET_ATTRIBUTE, "sepia");
  expect(errors).toEqual([]);
});
