import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { encode } from "../lib/create/code";
import { baseValues } from "../lib/create/colours";
import { type CreateConfig, DEFAULT_CONFIG, PENS } from "../lib/create/config";
import { PRESET_BASE_TOKENS } from "../lib/registry/theme-presets";
import { AXE_DISABLED_RULES } from "../lib/test/axe-rules";
import { paintInkFillsAsCss } from "./ink-fills";
import { waitForInk } from "./ready";

// The Create page (Task C4): the rail or its drawer drives the preview, the code is the URL,
// a custom look's colours are exactly `baseValues`, axe passes in both modes, and the page is
// shot at every width in light and dark for two fixed codes. Pixels on Linux only (CI).
const comparePixels = process.platform === "linux";

/** A custom look with every part tinted, a fine pen and the second faces. */
const CUSTOM: CreateConfig = {
  ...DEFAULT_CONFIG,
  look: {
    custom: {
      paper: { hue: 200, strength: 6 },
      ink: { hue: 280, strength: 8 },
      spot: { hue: 150, vividness: 7 },
    },
  },
  pen: { ...PENS.fine },
  fonts: { display: "reggae-one", dialogue: "patrick-hand-sc" },
  kit: { preset: "reader" },
};
const CODES = { default: encode(DEFAULT_CONFIG), custom: encode(CUSTOM) } as const;

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

const surface = (page: Page) => page.locator('[data-slot="create-preview-surface"]');

/** Opens `/create` (with a code) in a site mode, once the code is applied and the ink drawn. */
async function open(page: Page, mode: "light" | "dark", code?: string) {
  await page.addInitScript((theme) => localStorage.setItem("theme", theme), mode);
  const response = await page.goto(code ? `/create?c=${code}` : "/create");
  expect(response?.status()).toBe(200);
  await expect(surface(page)).toHaveAttribute("data-mode", mode);
  await waitForInk(page);
}

/**
 * Whether a variable of the preview wrapper paints as `expected`. Compared as sRGB pixels, as
 * presets.spec.ts does, so `oklch()` written two ways still compares equal.
 */
async function expectColour(page: Page, token: string, expected: string) {
  const [actual, wanted] = await surface(page).evaluate(
    (element, [name, colour]) => {
      const context = document.createElement("canvas").getContext("2d");
      const pixel = (value: string) => {
        if (!context) return [];
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      const value = getComputedStyle(element).getPropertyValue(`--${name}`).trim();
      return [pixel(value), pixel(colour)];
    },
    [token, expected] as const,
  );
  expect(wanted, `${expected} paints`).toHaveLength(3);
  actual.forEach((channel, index) => {
    expect(Math.abs(channel - wanted[index]), `--${token} is ${expected}`).toBeLessThanOrEqual(1);
  });
}

async function expectNoOverflow(page: Page) {
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width, "no horizontal overflow").toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
}

/** The rail on a desktop, the drawer (opened from its button) below it. */
async function choices(page: Page): Promise<Locator> {
  const rail = page.getByRole("complementary", { name: "Choices" });
  if (await rail.isVisible()) return rail;
  await page.getByRole("button", { name: /^Choices/ }).click();
  return page.getByRole("dialog", { name: "Choices" });
}

test("choosing Sepia and the brush pen writes the code and restyles the specimen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page, "light");
  const rail = await choices(page);
  await rail.getByRole("group", { name: "Look" }).getByRole("button", { name: "Sepia" }).click();
  // One history entry per burst of changes: let this one settle before the next.
  await expect(page).toHaveURL(/\/create\?c=111$/);
  await rail
    .getByRole("group", { name: "Named pen" })
    .getByRole("button", { name: "Brush" })
    .click();
  await expect(page).toHaveURL(/\/create\?c=1312$/);
  await expect(rail.getByRole("textbox", { name: "Code" })).toHaveValue("1312");
  await expectColour(page, "paper", baseValues({ preset: "sepia" }).light.paper);
  // The specimen inside the wrapper inherits it, and its frames drew with the brush.
  const card = surface(page).locator('section[aria-label="card"]');
  await expect(card).toHaveCSS("border-top-width", "2px");
  await expect
    .poll(() =>
      surface(page)
        .locator('[data-slot="ink-frame"] path')
        .evaluateAll((paths) => paths.some((path) => path.getAttribute("stroke-width") === "2")),
    )
    .toBe(true);
  // Back restores the code before the pen.
  await page.goBack();
  await expect(page).toHaveURL(/\/create\?c=111$/);
  await expect(rail.getByRole("textbox", { name: "Code" })).toHaveValue("111");
  expect(errors).toEqual([]);
});

test("a custom code's colours are exactly baseValues, in both preview modes", async ({ page }) => {
  await open(page, "light", CODES.custom);
  const values = baseValues(CUSTOM.look);
  for (const token of PRESET_BASE_TOKENS) await expectColour(page, token, values.light[token]);
  await page
    .getByRole("group", { name: "Preview mode" })
    .getByRole("button", { name: "Dark" })
    .click();
  await expect(surface(page)).toHaveAttribute("data-mode", "dark");
  for (const token of PRESET_BASE_TOKENS) await expectColour(page, token, values.dark[token]);
  // The derived tokens follow: the wrapper's background (bg-background) paints its paper.
  const [background, paper] = await surface(page).evaluate((element) => {
    const context = document.createElement("canvas").getContext("2d");
    const pixel = (value: string) => {
      if (!context) return [];
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const style = getComputedStyle(element);
    return [pixel(style.backgroundColor), pixel(style.getPropertyValue("--paper").trim())];
  });
  expect(background).toEqual(paper);
});

test("a damaged code shows the default with its reason", async ({ page }) => {
  await open(page, "light", "1zz");
  await expect(page.locator('[data-slot="create-refused"]')).toContainText("could not be read");
  await expectColour(page, "paper", baseValues({ preset: "default" }).light.paper);
});

test("on a phone the drawer changes a slider while the preview stays in view", async ({ page }) => {
  test.skip(test.info().project.name !== "w360", "the phone width");
  await open(page, "light");
  const trigger = page.getByRole("button", { name: /^Choices/ });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog", { name: "Choices" });
  await expect(drawer).toBeVisible();
  // The preview's top stays above the drawer.
  const top = await surface(page).boundingBox();
  const sheet = await drawer.boundingBox();
  expect(top && sheet && top.y < sheet.y).toBe(true);
  const thumb = drawer.getByRole("slider", { name: /^Outline width/ });
  await thumb.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() =>
      surface(page).evaluate((element) =>
        getComputedStyle(element).getPropertyValue("--outline-width").trim(),
      ),
    )
    .toBe("1.7px");
  // The default look with a custom pen: sections 2 (pen) only.
  await expect(page).toHaveURL(/\/create\?c=12[0-9A-Za-z]{6}$/);
  await expect(drawer.getByText("A custom pen: your own settings.")).toBeVisible();
  await expectNoOverflow(page);
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const mode of ["light", "dark"] as const) {
  test(`axe finds nothing on the page, preview included (${mode})`, async ({ page }) => {
    test.skip(test.info().project.name === "w768", "a phone and a desktop width are enough");
    await open(page, mode, CODES.custom);
    const { violations } = await new AxeBuilder({ page })
      .disableRules(AXE_DISABLED_RULES)
      .exclude("[data-base-ui-focus-guard]")
      .analyze();
    expect(axeFindings(violations), "axe violations").toEqual([]);
    // Contrast last: the pen's fills become CSS so axe can measure the text over them.
    await paintInkFillsAsCss(page);
    const contrast = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .exclude("[data-base-ui-focus-guard]")
      .analyze();
    expect(axeFindings(contrast.violations), "color-contrast below WCAG AA").toEqual([]);
  });
}

for (const [name, code] of Object.entries(CODES)) {
  for (const mode of ["light", "dark"] as const) {
    test(`page: ${name} code (${mode})`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      await open(page, mode, code);
      await expect(page.locator('[data-slot="create-code"]').first()).toHaveValue(code);
      await expectNoOverflow(page);
      if (comparePixels) {
        await expect(page).toHaveScreenshot(`create-${name}-${mode}.png`, { fullPage: true });
      } else if (process.env.CREATE_SHOTS) {
        await page.screenshot({
          path: `${process.env.CREATE_SHOTS}/create-${name}-${mode}-${test.info().project.name}.png`,
          fullPage: true,
        });
      }
      expect(errors).toEqual([]);
    });
  }
}
