import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { docItems } from "../lib/docs/catalog";
import { demoEntries } from "../lib/registry/demos.generated";
import { loadRegistry } from "../lib/registry/index";
import { hydrateAfterReveal, waitForInk } from "./ready";

// The site pages (SPEC-docs-site §11), light and dark, at each project's width: pixels on
// Linux only (CI), and everywhere no overflow, no axe violations and no errors.
const comparePixels = process.platform === "linux";

// The landing and the component index are shot at their first viewport
// (`site-<page>-viewport-<mode>.png`), not whole (SPEC-components-3 §8.1). The index is never
// shot whole: every new item moved that picture, so its cards are checked structurally below
// and each demo has its own baseline. The landing is also shot whole (`site-home-<mode>.png`)
// under `SITE_FULL=1` (main, `full` dispatches); a task that changes the landing regenerates
// that shot with a `full=true` update run.
const VIEWPORT_SHOT = new Set(["/", "/docs/components"]);
const FULL_SHOT_UNDER_FLAG = new Set(["/"]);
const siteFull = process.env.SITE_FULL === "1";

/** Whether a page is shot whole in this run. */
function fullShot(path: string): boolean {
  if (!VIEWPORT_SHOT.has(path)) return true;
  return siteFull && FULL_SHOT_UNDER_FLAG.has(path);
}

/** What the index must show: one card per documented item (the catalog items with demos). */
const indexItems = docItems(loadRegistry(resolve(__dirname, "../registry.json")), demoEntries);

const pages = [
  "/",
  "/docs",
  "/docs/installation",
  "/docs/theming",
  "/docs/agents",
  "/docs/components",
  "/docs/components/button",
  "/docs/components/speech-bubble",
  "/docs/components/page-turn",
];

/** `/` → `home`, `/docs/components/button` → `docs-components-button`. */
function slug(path: string): string {
  return path === "/" ? "home" : path.slice(1).replaceAll("/", "-");
}

/**
 * Overlay demos (dialog, sheet, tooltip, popover) render their stage in an iframe, which takes
 * `?mode=dark` once the page has hydrated: wait for that stage to load, then for its ink.
 */
async function waitForStages(page: Page, mode: "light" | "dark") {
  const iframes = page.locator("iframe");
  for (const iframe of await iframes.all()) {
    await expect(iframe).toHaveAttribute("src", mode === "dark" ? /\?mode=dark$/ : /^[^?]+$/);
    const src = new URL((await iframe.getAttribute("src")) ?? "", page.url()).href;
    const handle = await iframe.elementHandle();
    await expect.poll(async () => (await handle?.contentFrame())?.url()).toBe(src);
    const frame = await handle?.contentFrame();
    if (!frame) throw new Error(`No frame for ${src}`);
    await expect(frame.locator("html")).toHaveAttribute("data-demo-ready", "true");
    await waitForInk(frame);
  }
}

/**
 * The index below the first viewport, without pixels: one card per documented item, each with
 * its title linking to its page and its description, and none reaching past the viewport.
 */
async function expectIndexCards(page: Page, viewport: number) {
  const cards = await page
    .locator('[data-slot="component-index"] [data-item]')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const link = node.querySelector<HTMLAnchorElement>('[data-slot="card-title"] a');
        const box = node.getBoundingClientRect();
        return {
          name: (node as HTMLElement).dataset.item ?? "",
          title: link?.textContent?.trim() ?? "",
          href: link?.getAttribute("href") ?? "",
          description:
            node.querySelector('[data-slot="card-description"]')?.textContent?.trim() ?? "",
          left: box.left,
          right: box.right,
        };
      }),
    );
  expect(cards.length, "one card per documented item").toBe(indexItems.length);
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  expect(
    cards
      .map(({ name, title, href, description }) => ({ name, title, href, description }))
      .sort(byName),
  ).toEqual(
    indexItems
      .map((item) => ({
        name: item.name,
        title: item.title,
        href: `/docs/components/${item.name}`,
        description: item.description,
      }))
      .sort(byName),
  );
  const outside = cards.filter(({ left, right }) => left < 0 || right > viewport);
  expect(
    outside.map(({ name }) => name),
    "cards past the viewport's edges",
  ).toEqual([]);
}

const LAZY_DEMOS = '[data-slot="component-index"] [data-slot="lazy-demo"]';

/** The index's demo boxes against the first viewport, in page coordinates. */
function lazyDemoCounts(page: Page) {
  return page.locator(LAZY_DEMOS).evaluateAll((nodes) => {
    const screen = window.innerHeight;
    const boxes = nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return {
        top: box.top + window.scrollY,
        bottom: box.bottom + window.scrollY,
        mounted: node.getAttribute("data-mounted") === "true",
      };
    });
    const firstViewport = boxes.filter(({ top, bottom }) => top < screen && bottom > 0);
    return {
      total: boxes.length,
      mounted: boxes.filter(({ mounted }) => mounted).length,
      // The first viewport plus one screen below it: the observer's one-viewport margin.
      near: boxes.filter(({ top, bottom }) => top <= 2 * screen && bottom > 0).length,
      firstViewport: firstViewport.length,
      firstViewportMounted: firstViewport.filter(({ mounted }) => mounted).length,
    };
  });
}

/**
 * Lazy cards (SPEC-components-3 §3, §8.2): after load every demo in the first viewport is
 * mounted and none further than one screen below it.
 */
async function expectLazyDemosOnLoad(page: Page) {
  await expect
    .poll(async () => {
      const { firstViewport, firstViewportMounted } = await lazyDemoCounts(page);
      return firstViewport > 0 && firstViewportMounted === firstViewport;
    }, "every demo in the first viewport mounts")
    .toBe(true);
  const { mounted, near, total } = await lazyDemoCounts(page);
  expect(mounted, `mounted demos after load (${near} near the first viewport)`).toBeLessThanOrEqual(
    near,
  );
  expect(mounted, "the index leaves the demos further down unmounted").toBeLessThan(total);
}

/**
 * Focus and scroll stay the reader's while the cards mount (Task 80): the overlay previews are
 * inert, so a stage whose popup opens on mount neither pulls focus into its frame (a modal one
 * would trap Tab there) nor scrolls the page to it. `top` is where the page was last put.
 */
async function expectFocusAndScrollKept(page: Page, top: number) {
  const state = await page.evaluate(() => ({
    y: window.scrollY,
    max: document.documentElement.scrollHeight - window.innerHeight,
    active: document.activeElement?.tagName ?? "",
    title: document.activeElement?.getAttribute("title") ?? "",
  }));
  expect(state.active, `focus moved into the frame "${state.title}"`).not.toBe("IFRAME");
  expect(
    Math.abs(state.y - Math.min(top, state.max)),
    `the page scrolled by itself to ${state.y} (put at ${top})`,
  ).toBeLessThanOrEqual(1);
}

/**
 * Scrolls the index screen by screen to the bottom; every demo mounts on the way, and none moves
 * the focus or the scroll position. Returns where the page was put last.
 */
async function expectLazyDemosOnScroll(page: Page): Promise<number> {
  const { total } = await lazyDemoCounts(page);
  const [height, screen] = await page.evaluate(() => [
    document.documentElement.scrollHeight,
    window.innerHeight,
  ]);
  let last = 0;
  for (let top = 0; top < height + screen; top += screen / 2) {
    await expectFocusAndScrollKept(page, last);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    last = top;
  }
  await expect
    .poll(async () => (await lazyDemoCounts(page)).mounted, "every demo mounts by the bottom")
    .toBe(total);
  return last;
}

/** Every inline demo fits its fixed stage (`TALL_STAGES` in the index raises one that does not). */
async function expectDemosFitStages(page: Page) {
  const overflowing = await page
    .locator(`${LAZY_DEMOS} > section`)
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => node.scrollHeight > node.clientHeight + 1)
        .map((node) => `${node.getAttribute("aria-label")}: ${node.scrollHeight}px`),
    );
  expect(overflowing, "demos taller than their stage").toEqual([]);
}

/**
 * The suite's axe pass over a whole page and the stages it embeds, contrast included. Base UI's
 * focus guards around an open popup are aria-hidden sentinels with tabindex 0 that hand focus on
 * at once; axe only lets them pass under an open dialog, so an open menu or select stage (an
 * iframe) would fail on Base UI's own markup. Inside a frame `region` is off, as on the stage
 * page itself (e2e/demos.spec.ts): a stage is a fragment, and its own content is checked there.
 * A node in a frame is one whose target is a frame path (`["iframe", "…"]`). Every other node of
 * the page and of its stages is checked.
 */
async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .exclude("[data-base-ui-focus-guard]")
    .exclude(["iframe", "[data-base-ui-focus-guard]"])
    .analyze();
  const found = violations
    .map(({ id, nodes }) => ({
      id,
      targets: nodes
        .filter((node) => id !== "region" || node.target.length === 1)
        .map((node) => node.target),
    }))
    .filter(({ targets }) => targets.length > 0);
  expect(found, "axe violations").toEqual([]);
}

/**
 * What a whole-page shot masks (Task 68): an item page's sidebar. Its scroll is not the test's
 * to set: Fumadocs scrolls the active item into view when it is out of view at the moment it
 * checks, and the full-page capture itself moves it again (locally a sidebar set to 0 or to
 * 420 px was captured at 135), so its position in the shot depended on the run. The mask is
 * painted in the page's own background, and the other docs pages' shots still show the sidebar.
 * Below 768 px the sidebar is a closed drawer (`#nd-sidebar` is not rendered) and nothing is
 * masked.
 */
async function shotOptions(page: Page, path: string) {
  if (!path.startsWith("/docs/components/")) return {};
  const maskColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  return { mask: [page.locator("#nd-sidebar")], maskColor };
}

for (const path of pages) {
  for (const mode of ["light", "dark"] as const) {
    test(`${path} (${mode})`, async ({ page }) => {
      // The component index renders every item's default demo as a card (45 and growing), so
      // loading, inking, screenshotting and axe-checking it takes most of the default 30 s on a
      // busy machine. Triple the budget for that one page; every other page keeps the default.
      if (path === "/docs/components") test.slow();
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      // next-themes reads the stored theme before hydration; set it before any page script.
      await page.addInitScript((theme) => localStorage.setItem("theme", theme), mode);
      // The docs content hydrates, never renders anew on the client: one wobble per shot.
      await hydrateAfterReveal(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      const html = page.locator("html");
      if (mode === "dark") await expect(html).toHaveClass(/\bdark\b/);
      else await expect(html).not.toHaveClass(/\bdark\b/);
      await waitForInk(page);
      if (path === "/docs/components") {
        // The first viewport's demos mount after hydration; then ink them and load their stages.
        await expectLazyDemosOnLoad(page);
        await waitForInk(page);
      }
      await waitForStages(page, mode);
      if (path === "/docs/components") await expectFocusAndScrollKept(page, 0);

      if (comparePixels) {
        // The whole page first, in the state its baseline was always taken in.
        if (fullShot(path)) {
          await expect(page).toHaveScreenshot(`site-${slug(path)}-${mode}.png`, {
            fullPage: true,
            ...(await shotOptions(page, path)),
          });
        }
        if (VIEWPORT_SHOT.has(path)) {
          // The first viewport is the top of the page (the full shot above may leave it scrolled).
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
          await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
          await expect(page).toHaveScreenshot(`site-${slug(path)}-viewport-${mode}.png`);
        }
      }

      if (path === "/docs/components") {
        // Every demo mounted, so the checks below see the whole index.
        const top = await expectLazyDemosOnScroll(page);
        await waitForInk(page);
        await waitForStages(page, mode);
        // Late openers too (context-menu opens once its fonts are ready).
        await expectFocusAndScrollKept(page, top);
        await expectDemosFitStages(page);
      }

      const viewport = page.viewportSize()?.width ?? 0;
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, "no horizontal overflow").toBeLessThanOrEqual(viewport);

      if (path === "/docs/components") await expectIndexCards(page, viewport);

      await expectNoAxeViolations(page);
      expect(errors).toEqual([]);
    });
  }
}

// Overlay item pages and the gallery embed live stages whose popup opens on load. A stage holds
// its script-driven focus while embedded (lib/docs/stage-focus.ts), so the page keeps the
// reader's focus and scroll position, and the stage still works once they go there. Each page
// then gets the suite's axe pass, stages included, at every width in light mode (no pixels).
const OVERLAY_PAGES = [
  "/docs/components/dialog",
  "/docs/components/popover",
  "/docs/components/context-menu",
  "/docs/components/menubar",
  "/demo/dialog",
];

for (const path of OVERLAY_PAGES) {
  test(`${path} keeps the reader's focus and scroll while its stages open`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await waitForInk(page);
    await waitForStages(page, "light");
    expect(await page.locator("iframe").count(), "the page embeds stages").toBeGreaterThan(0);
    // Every stage has had its chance to open: none took the focus or moved the page.
    await expectFocusAndScrollKept(page, 0);
    for (const iframe of await page.locator("iframe").all()) {
      const frame = await (await iframe.elementHandle())?.contentFrame();
      await expect(frame?.locator("html") ?? iframe).toHaveAttribute("data-focus-held", "true");
    }
    await expectNoAxeViolations(page);
  });
}

test("an embedded dialog stage takes focus once the reader goes there", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/docs/components/dialog");
  await waitForInk(page);
  await waitForStages(page, "light");
  const iframe = page.locator("iframe").first();
  const stage = page.frameLocator("iframe").first();
  const dialog = stage.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expectFocusAndScrollKept(page, 0);

  // The keyboard reaches the stage in the page's own Tab order, and the open dialog takes the
  // focus then, as it would on its own page.
  const inFrame = () => page.evaluate(() => document.activeElement?.tagName === "IFRAME");
  for (let press = 0; press < 300 && !(await inFrame()); press++) await page.keyboard.press("Tab");
  expect(await inFrame(), "Tab reaches the stage").toBe(true);
  await expect(iframe).toBeFocused();
  await expect(stage.locator("html")).not.toHaveAttribute("data-focus-held", "true");
  await expect
    .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);

  // Escape closes the dialog, and Tab then leaves the frame: the reader is never kept there.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  for (let press = 0; press < 20 && (await inFrame()); press++) await page.keyboard.press("Tab");
  expect(await inFrame(), "Tab leaves the stage").toBe(false);
});

test("an embedded dialog stage works with the pointer from the start", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/docs/components/dialog");
  await waitForInk(page);
  await waitForStages(page, "light");
  const stage = page.frameLocator("iframe").first();
  const field = stage.getByRole("dialog").getByRole("textbox").first();
  // The dialog is fixed inside its frame, so bring the frame itself into view for the press.
  await page.locator("iframe").first().scrollIntoViewIfNeeded();
  await field.click();
  await expect(field).toBeFocused();
  await expect(stage.locator("html")).not.toHaveAttribute("data-focus-held", "true");
  await field.fill("Ink");
  await expect(field).toHaveValue("Ink");
});

// The Markdown and registry routes (Tasks 43, 44): status, type and headers, once.
test("markdown and registry routes", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "w1280", "plain requests; one project is enough");

  const llms = await request.get("/llms.txt");
  expect(llms.status()).toBe(200);
  expect(llms.headers()["content-type"]).toMatch(/^text\/plain\b/);

  const full = await request.get("/llms-full.txt");
  expect(full.status()).toBe(200);
  expect(await full.text()).toContain("speech-bubble");

  const markdown = await request.get("/docs/components/button.md");
  expect(markdown.status()).toBe(200);
  expect(markdown.headers()["content-type"]).toMatch(/^text\/markdown\b/);
  // Demo sources import each item from where `shadcn add` writes it.
  expect(await markdown.text()).toContain('from "@/components/ui/button"');
  const bubble = await (await request.get("/docs/components/speech-bubble.md")).text();
  expect(bubble).toContain('from "@/components/speech-bubble"');
  expect(bubble).not.toContain("@/components/ui/speech-bubble");

  // The agents page carries each client's MCP config and the AGENTS.md snippet as fences.
  const agents = await (await request.get("/docs/agents.md")).text();
  expect(agents).toContain("**Codex**");
  expect(agents).toContain("```toml\n[mcp_servers.mangacn]\n");
  expect(agents).toContain("```markdown\n## UI: mangacn");

  const item = await request.get("/r/button.json");
  expect(item.status()).toBe(200);
  expect(item.headers()["content-type"]).toMatch(/^application\/json\b/);
  expect(item.headers()["access-control-allow-origin"]).toBe("*");
  expect(item.headers()["cache-control"]).toBe(
    "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
  );
});
