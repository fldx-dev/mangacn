import AxeBuilder from "@axe-core/playwright";
import { expect, type Frame, type Locator, type Page, test } from "@playwright/test";
import { encode } from "../lib/create/code";
import { baseValues } from "../lib/create/colours";
import { type CreateConfig, DEFAULT_CONFIG, PENS } from "../lib/create/config";
import { PREVIEW_PAGES } from "../lib/create/pages";
import { PRESET_BASE_TOKENS } from "../lib/registry/theme-presets";
import { AXE_DISABLED_RULES } from "../lib/test/axe-rules";
import { paintInkFillsAsCss } from "./ink-fills";
import { waitForInk } from "./ready";
import { comparePixels, shoot } from "./shoot";

// The Create page (Task C4): the rail or its drawer drives the preview, the code is the URL,
// a custom look's colours are exactly `baseValues`, axe passes in both modes, and the page is
// shot at every width in light and dark for two fixed codes. Pixels on Linux only (CI). Task C5:
// the preview tabs frame page blocks at the code, and `?c=` styles a stage or a view by itself.

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
        await shoot(page, `create-${name}-${mode}.png`, { fullPage: true });
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

// Task C5: block previews and `?c=` on the stage and view routes.

/** The colour a variable on a frame's root paints, and `expected`'s, as sRGB pixels. */
async function rootPixels(frame: Frame, token: string, expected: string) {
  return frame.evaluate(
    ([name, colour]) => {
      const context = document.createElement("canvas").getContext("2d");
      const pixel = (value: string) => {
        if (!context) return [];
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      const value = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`);
      return [pixel(value.trim()), pixel(colour)];
    },
    [token, expected] as const,
  );
}

/** Whether a variable of a frame's root paints as `expected` (polled: a new code is a message). */
async function expectRootColour(frame: Frame, token: string, expected: string) {
  await expect
    .poll(
      async () => {
        const [actual, wanted] = await rootPixels(frame, token, expected);
        return (
          wanted.length === 3 &&
          actual.length === 3 &&
          actual.every((channel, index) => Math.abs(channel - wanted[index]) <= 1)
        );
      },
      { message: `--${token} is ${expected}` },
    )
    .toBe(true);
}

/** The frame of the open page tab, once its view has applied the code and drawn. */
async function blockFrame(page: Page, block: string): Promise<Frame> {
  const element = page.locator(`[data-slot="create-block"][data-block="${block}"] iframe`);
  await expect(element).toBeVisible();
  const frame = await (await element.elementHandle())?.contentFrame();
  if (!frame) throw new Error(`no frame for ${block}`);
  await expect(frame.locator("html")).toHaveAttribute("data-demo-ready", "true");
  await waitForInk(frame);
  return frame;
}

/** The first face of a text element whose family matches `pattern`, and whether it loaded. */
async function loadedFace(frame: Frame, pattern: string) {
  return frame.evaluate(async (source) => {
    await document.fonts.ready;
    const matcher = new RegExp(source, "i");
    const element = [...document.querySelectorAll<HTMLElement>("body *")].find(
      (node) =>
        node.childElementCount === 0 &&
        Boolean(node.textContent?.trim()) &&
        matcher.test(getComputedStyle(node).fontFamily),
    );
    if (!element) return null;
    const family = getComputedStyle(element).fontFamily.split(",")[0].trim();
    await document.fonts.load(`16px ${family}`, element.textContent ?? "");
    const bare = family.replace(/["']/g, "");
    return {
      family: bare,
      loaded: [...document.fonts].some(
        (face) => face.family.replace(/["']/g, "") === bare && face.status === "loaded",
      ),
    };
  }, pattern);
}

/** The frame window's own mark, to tell a restyle from a reload. */
type Marked = { createKept?: boolean };

test("each page tab frames its block in the custom code's colours and follows a new code", async ({
  page,
}) => {
  test.skip(test.info().project.name === "w768", "a phone and a desktop width are enough");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page, "light", CODES.custom);
  const values = baseValues(CUSTOM.look).light;
  for (const { label, block } of PREVIEW_PAGES) {
    await page.getByRole("tab", { name: label }).click();
    const frame = await blockFrame(page, block);
    await expectRootColour(frame, "paper", values.paper);
    await expectRootColour(frame, "spot", values.spot);
  }
  // The open frame (Chat) follows a new look by message, without loading again.
  const chat = await blockFrame(page, "chat-thread");
  await chat.evaluate(() => {
    (window as Marked).createKept = true;
  });
  const rail = await choices(page);
  await rail.getByRole("group", { name: "Look" }).getByRole("button", { name: "Sepia" }).click();
  await expectRootColour(chat, "paper", baseValues({ preset: "sepia" }).light.paper);
  expect(await chat.evaluate(() => (window as Marked).createKept)).toBe(true);
  // Dark loads the frame again, in dark mode at the current code.
  const drawer = page.getByRole("dialog", { name: "Choices" });
  if (await drawer.isVisible()) {
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  }
  await page
    .getByRole("group", { name: "Preview mode" })
    .getByRole("button", { name: "Dark" })
    .click();
  await expect(page.locator('[data-slot="create-block"] iframe')).toHaveAttribute(
    "src",
    /&mode=dark$/,
  );
  const dark = await blockFrame(page, "chat-thread");
  await expect(dark.locator("html")).toHaveClass(/\bdark\b/);
  await expectRootColour(dark, "paper", baseValues({ preset: "sepia" }).dark.paper);
  expect(errors).toEqual([]);
});

test("a code with Reggae One sets the frame's display face in Reggae One", async ({ page }) => {
  test.skip(test.info().project.name !== "w1280", "fonts do not depend on the width");
  await open(page, "light", CODES.custom);
  await page.getByRole("tab", { name: "Login" }).click();
  const frame = await blockFrame(page, "login-01");
  const face = await loadedFace(frame, "reggae");
  expect(face, "an element set in Reggae One").not.toBeNull();
  expect(face?.family).toMatch(/reggae/i);
  expect(face?.loaded).toBe(true);
});

test("opening a page tab neither scrolls the page nor takes the focus", async ({ page }) => {
  await open(page, "light", CODES.custom);
  await page.getByRole("tab", { name: "Specimen" }).focus();
  const scroll = await page.evaluate(() => window.scrollY);
  for (const { label, block } of PREVIEW_PAGES) {
    const tab = page.getByRole("tab", { name: label });
    await page.keyboard.press("ArrowRight");
    await expect(tab).toBeFocused();
    if ((await tab.getAttribute("aria-selected")) !== "true") await page.keyboard.press("Enter");
    await blockFrame(page, block);
    await expect(tab).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
  }
  await expectNoOverflow(page);
});

for (const mode of ["light", "dark"] as const) {
  test(`axe finds nothing with a page tab open (${mode})`, async ({ page }) => {
    test.skip(test.info().project.name === "w768", "a phone and a desktop width are enough");
    await open(page, mode, CODES.custom);
    await page.getByRole("tab", { name: "Series page" }).click();
    await blockFrame(page, "series-page");
    // Contrast inside the frame is measured on the view itself, below.
    const { violations } = await new AxeBuilder({ page })
      .disableRules(AXE_DISABLED_RULES)
      .exclude("[data-base-ui-focus-guard]")
      .analyze();
    expect(axeFindings(violations), "axe violations").toEqual([]);
  });

  for (const path of ["/view/login-01", "/view/series-page"]) {
    test(`axe finds nothing on ${path} under a custom code (${mode})`, async ({ page }) => {
      test.skip(test.info().project.name !== "w1280", "the views' own suite covers the widths");
      const search = new URLSearchParams({ c: CODES.custom });
      if (mode === "dark") search.set("mode", "dark");
      const response = await page.goto(`${path}?${search}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
      await waitForInk(page);
      await expectRootColour(page.mainFrame(), "paper", baseValues(CUSTOM.look)[mode].paper);
      // A whole page: its page rules apply.
      const pageRules = AXE_DISABLED_RULES.filter(
        (rule) => rule !== "region" && rule !== "page-has-heading-one",
      );
      const { violations } = await new AxeBuilder({ page })
        .disableRules(pageRules)
        .exclude("[data-base-ui-focus-guard]")
        .analyze();
      expect(axeFindings(violations), "axe violations").toEqual([]);
      await paintInkFillsAsCss(page);
      const contrast = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .exclude("[data-base-ui-focus-guard]")
        .analyze();
      expect(axeFindings(contrast.violations), "color-contrast below WCAG AA").toEqual([]);
    });
  }
}

test("on a stage ?c= wins over ?theme=, and a bad code is the default look", async ({ page }) => {
  test.skip(test.info().project.name !== "w1280", "the look does not depend on the width");
  const html = page.locator("html");
  await page.goto(`/demo/theme/specimen?theme=sepia&c=${CODES.custom}`);
  await expect(html).toHaveAttribute("data-demo-ready", "true");
  expect(await html.getAttribute("data-theme-preset")).toBeNull();
  await expectRootColour(page.mainFrame(), "spot", baseValues(CUSTOM.look).light.spot);
  await page.goto("/demo/button/default?c=1zz&mode=dark");
  await expect(html).toHaveAttribute("data-demo-ready", "true");
  expect((await html.getAttribute("style")) ?? "").toBe("");
  await expectRootColour(page.mainFrame(), "paper", baseValues({ preset: "default" }).dark.paper);
});
