import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { DOCUMENT_END_ID } from "../components/docs/page-end";
import { BLOCKS_CATALOG, type DocItem, docItems } from "../lib/docs/catalog";
import { loadRegistry } from "../lib/registry/index";
import { variantMeta } from "../lib/registry/variant-meta.generated";
import { variantEntries } from "../lib/registry/variants.generated";
import { hydrateAfterReveal, waitForInk } from "./ready";
import { comparePixels, shoot } from "./shoot";

// The site pages (SPEC-docs-site §11), light and dark, at each project's width: pixels on
// Linux only (CI), and everywhere no overflow, no axe violations and no errors.

// The landing and the two indexes (components, blocks) are shot at their first viewport
// (`site-<page>-viewport-<mode>.png`), not whole (SPEC-components-3 §8.1). An index is never
// shot whole: every new item moved that picture, so its cards are checked structurally below
// and each variant (and each page block's view) has its own baseline. The landing is also shot whole (`site-home-<mode>.png`)
// under `SITE_FULL=1` (main, `full` dispatches); a task that changes the landing regenerates
// that shot with a `full=true` update run.
const VIEWPORT_SHOT = new Set(["/", "/docs/components", "/docs/blocks"]);
const FULL_SHOT_UNDER_FLAG = new Set(["/"]);
const siteFull = process.env.SITE_FULL === "1";

/** Whether a page is shot whole in this run. */
function fullShot(path: string): boolean {
  if (!VIEWPORT_SHOT.has(path)) return true;
  return siteFull && FULL_SHOT_UNDER_FLAG.has(path);
}

const registry = loadRegistry(resolve(__dirname, "../registry.json"));

/** An index page: the slot its cards sit in, the items it must show and where each links. */
interface IndexPage {
  slot: "component-index" | "block-index";
  items: DocItem[];
  section: string;
  /** Whether every inline variant must fit its fixed stage (a block's preview is clipped). */
  variantsFit: boolean;
}

/** One card per documented item (the catalog items with variants), on each index. */
const INDEXES: Record<string, IndexPage> = {
  "/docs/components": {
    slot: "component-index",
    items: docItems(registry, variantEntries),
    section: "/docs/components",
    variantsFit: true,
  },
  "/docs/blocks": {
    slot: "block-index",
    items: docItems(registry, variantEntries, BLOCKS_CATALOG),
    section: "/docs/blocks",
    variantsFit: false,
  },
};

const pages = [
  "/",
  "/docs",
  "/docs/installation",
  "/docs/theming",
  "/docs/agents",
  "/docs/components",
  "/docs/blocks",
  "/docs/components/button",
  "/docs/components/speech-bubble",
  "/docs/components/page-turn",
];

/** `/` → `home`, `/docs/components/button` → `docs-components-button`. */
function slug(path: string): string {
  return path === "/" ? "home" : path.slice(1).replaceAll("/", "-");
}

/**
 * Overlay variants (dialog, sheet, tooltip, popover) render their stage in an iframe, which takes
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
    await expect(frame.locator("html")).toHaveAttribute("data-variant-ready", "true");
    await waitForInk(frame);
  }
}

/**
 * The index below the first viewport, without pixels: one card per documented item, each with
 * its title linking to its page and its description, and none reaching past the viewport.
 */
async function expectIndexCards(page: Page, index: IndexPage, viewport: number) {
  const cards = await page.locator(`[data-slot="${index.slot}"] [data-item]`).evaluateAll((nodes) =>
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
  expect(cards.length, "one card per documented item").toBe(index.items.length);
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  expect(
    cards
      .map(({ name, title, href, description }) => ({ name, title, href, description }))
      .sort(byName),
  ).toEqual(
    index.items
      .map((item) => ({
        name: item.name,
        title: item.title,
        href: `${index.section}/${item.name}`,
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

/** An index's lazy variant boxes. */
const lazyVariants = (index: IndexPage) => `[data-slot="${index.slot}"] [data-slot="lazy-variant"]`;

/** The index's variant boxes against the first viewport, in page coordinates. */
function lazyVariantCounts(page: Page, index: IndexPage) {
  return page.locator(lazyVariants(index)).evaluateAll((nodes) => {
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
 * Lazy cards (SPEC-components-3 §3, §8.2): after load every variant in the first viewport is
 * mounted and none further than one screen below it.
 */
async function expectLazyVariantsOnLoad(page: Page, index: IndexPage) {
  await expect
    .poll(async () => {
      const { firstViewport, firstViewportMounted } = await lazyVariantCounts(page, index);
      return firstViewport > 0 && firstViewportMounted === firstViewport;
    }, "every variant in the first viewport mounts")
    .toBe(true);
  const { mounted, near, total } = await lazyVariantCounts(page, index);
  expect(
    mounted,
    `mounted variants after load (${near} near the first viewport)`,
  ).toBeLessThanOrEqual(near);
  expect(mounted, "the index leaves the variants further down unmounted").toBeLessThan(total);
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
 * Scrolls the index screen by screen to the bottom; every variant mounts on the way, and none moves
 * the focus or the scroll position. Returns where the page was put last.
 */
async function expectLazyVariantsOnScroll(page: Page, index: IndexPage): Promise<number> {
  const { total } = await lazyVariantCounts(page, index);
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
    .poll(
      async () => (await lazyVariantCounts(page, index)).mounted,
      "every variant mounts by the bottom",
    )
    .toBe(total);
  return last;
}

/** Every inline variant fits its fixed stage (`TALL_STAGES` in the index raises one that does not). */
async function expectVariantsFitStages(page: Page, index: IndexPage) {
  const overflowing = await page
    .locator(`${lazyVariants(index)} > section`)
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => node.scrollHeight > node.clientHeight + 1)
        .map((node) => `${node.getAttribute("aria-label")}: ${node.scrollHeight}px`),
    );
  expect(overflowing, "variants taller than their stage").toEqual([]);
}

/**
 * The suite's axe pass over a whole page and the stages it embeds, contrast included. Base UI's
 * focus guards around an open popup are aria-hidden sentinels with tabindex 0 that hand focus on
 * at once; axe only lets them pass under an open dialog, so an open menu or select stage (an
 * iframe) would fail on Base UI's own markup. Inside a frame `region` is off, as on the stage
 * page itself (e2e/variants.spec.ts): a stage is a fragment, and its own content is checked there.
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

/**
 * A docs page holds its first frame until the whole document is parsed
 * (components/docs/page-end.tsx). Read from the HTML as served, which is what the parser sees:
 * the head has the expect link once, and nothing in the document has the id it names, so the
 * frame is released at the end of the document, after the script that reveals the body.
 */
async function expectPaintsWithPage(page: Page, path: string) {
  const html = await (await page.request.get(path)).text();
  const head = html.slice(0, html.indexOf("<body"));
  const link = `<link rel="expect" href="#${DOCUMENT_END_ID}" blocking="render"/>`;
  expect(head.split(link).length - 1, "one expect link in the head").toBe(1);
  expect(html.includes(`id="${DOCUMENT_END_ID}"`), "no element has the id the link names").toBe(
    false,
  );
  expect(html, "the body's reveal script is in the document").toContain('$RC("B:0","S:0")');
}

for (const path of pages) {
  for (const mode of ["light", "dark"] as const) {
    test(`${path} (${mode})`, async ({ page }) => {
      // The component index renders every item's default variant as a card (45 and growing), so
      // loading, inking, screenshotting and axe-checking it takes most of the default 30 s on a
      // busy machine; the Blocks index loads a page per page block. Triple the budget for the
      // indexes; every other page keeps the default.
      const index = INDEXES[path];
      if (index) test.slow();
      // The Blocks index loads a stage per page block; with batch 8's App group it reached the
      // tripled 90 s budget on CI. Six minutes leaves room for the blocks still to come.
      if (path === "/docs/blocks") test.setTimeout(360_000);
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
      if (index) {
        // The first viewport's variants mount after hydration; then ink them and load their stages.
        await expectLazyVariantsOnLoad(page, index);
        await waitForInk(page);
      }
      await waitForStages(page, mode);
      if (index) await expectFocusAndScrollKept(page, 0);

      if (comparePixels) {
        // The whole page first, in the state its baseline was always taken in.
        if (fullShot(path)) {
          await shoot(page, `site-${slug(path)}-${mode}.png`, {
            fullPage: true,
            ...(await shotOptions(page, path)),
          });
        }
        if (VIEWPORT_SHOT.has(path)) {
          // The first viewport is the top of the page (the full shot above may leave it scrolled).
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
          await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
          await shoot(page, `site-${slug(path)}-viewport-${mode}.png`);
        }
      }

      if (index) {
        // Every variant mounted, so the checks below see the whole index.
        const top = await expectLazyVariantsOnScroll(page, index);
        await waitForInk(page);
        await waitForStages(page, mode);
        // Late openers too (context-menu opens once its fonts are ready).
        await expectFocusAndScrollKept(page, top);
        if (index.variantsFit) await expectVariantsFitStages(page, index);
      }

      const viewport = page.viewportSize()?.width ?? 0;
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, "no horizontal overflow").toBeLessThanOrEqual(viewport);

      if (index) await expectIndexCards(page, index, viewport);
      if (path.startsWith("/docs")) await expectPaintsWithPage(page, path);

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
  "/gallery/dialog",
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

// A sidebar preview on a docs page lays the sidebar out at a desktop width, scaled to the column,
// from a tablet's window up, as `/view` shows it there; only a phone's column shows the phone
// layout (Task 144; blocks.spec.ts checks the 1280 px column). A block opens at the tablet's
// width in a 768 px window's column, where the desktop's would be under half size (Task 175).
test("sidebar previews show the desktop layout from a tablet's window", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "w1280", "blocks.spec.ts checks w1280");
  const phone = testInfo.project.name === "w360";
  const frameOf = async (selector: string) => {
    const iframe = page.locator(`${selector} iframe`).first();
    const frame = await (await iframe.elementHandle())?.contentFrame();
    if (!frame) throw new Error(`No frame in ${selector}`);
    await expect(frame.locator("html")).toHaveAttribute("data-variant-ready", "true");
    return frame;
  };

  await page.goto("/docs/blocks/sidebar-07");
  const preview = page.locator('[data-slot="block-preview"]');
  const block = await frameOf('[data-slot="block-preview"]');
  await expect(preview).toHaveAttribute("data-width", phone ? "phone" : "tablet");
  await expect.poll(() => block.evaluate(() => window.innerWidth)).toBe(phone ? 375 : 768);

  await page.goto("/docs/components/sidebar");
  const stage = await frameOf('[data-slot="variant-stage-box"]');
  const stageWidth = () => stage.evaluate(() => window.innerWidth);
  if (phone) await expect.poll(stageWidth).toBeLessThan(768);
  else await expect.poll(stageWidth).toBeGreaterThanOrEqual(768);
});

// The skip link points at content the page has from its first HTML, before any script: axe
// counts a link to a missing id as content outside a landmark (`region`), which failed docs pages
// whenever the scan ran before hydration.
test("the skip link's target is in the server's HTML", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "w1280", "plain requests; one project is enough");
  for (const path of ["/", "/docs", "/docs/components/speech-bubble", "/create"]) {
    const html = await (await request.get(path)).text();
    const target = html.match(/<a href="#([\w-]+)"[^>]*>Skip to content<\/a>/)?.[1];
    expect(target, `${path}: the skip link`).toBeTruthy();
    expect(html, `${path}: #${target} is on the page`).toContain(`id="${target}"`);
  }
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
  // Variant sources import each item from where `shadcn add` writes it.
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

/**
 * A page turns only when the reader goes to another page (components/docs/page-turn.tsx). Loading
 * a page starts no view transition, and a link to another page starts exactly one, the page turn,
 * which runs to its end. Before MANGA-15 a load started three or four (the streamed content's
 * reveal and the updates after hydration) and a navigation two: a transition in flight paints
 * only the viewport it captured, and the resize of a full-page screenshot aborts it, which made
 * the `/docs/agents` and `/docs/theming` shots flaky. Back is committed at once by React (no
 * turn, as before); it may start no transition that a screenshot then aborts either. Under reduced
 * motion the turn is a plain swap.
 */
for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`a docs navigation turns the page once (${reducedMotion} motion)`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    // Each view transition: the classes it animates, its length once finished, or `aborted` when
    // it never got to animate.
    await page.addInitScript(() => {
      const start = Document.prototype.startViewTransition;
      if (!start) return;
      const transitions: { classes: string[]; length?: number; aborted?: boolean }[] = [];
      Object.assign(window, { transitions });
      Document.prototype.startViewTransition = function (this: Document, ...args) {
        const begun = performance.now();
        const transition = start.apply(this, args as Parameters<typeof start>);
        const entry: (typeof transitions)[number] = { classes: [] };
        transitions.push(entry);
        transition.ready.then(
          () => {
            entry.classes = [...document.querySelectorAll<HTMLElement>("[style]")]
              .map((node) => node.style.getPropertyValue("view-transition-class"))
              .filter(Boolean);
          },
          () => {
            entry.aborted = true;
          },
        );
        transition.finished.then(() => {
          entry.length = performance.now() - begun;
        });
        return transition;
      } as typeof start;
    });
    const transitions = () =>
      page.evaluate(
        () =>
          (window as unknown as { transitions: unknown[] }).transitions as {
            classes: string[];
            length?: number;
            aborted?: boolean;
          }[],
      );
    /** Waits until the page has settled: ink drawn, the network quiet, no transition running. */
    const settle = async () => {
      await waitForInk(page);
      await page.waitForLoadState("networkidle");
      await page.waitForFunction(
        () => !(document as Document & { activeViewTransition?: unknown }).activeViewTransition,
      );
    };
    /** The docs page on screen (cacheComponents keeps the one before it, hidden). */
    const heading = page.locator("#nd-page h1").filter({ visible: true });

    await hydrateAfterReveal(page);
    await page.goto("/docs/theming");
    await settle();
    expect(await transitions(), "view transitions on load").toEqual([]);

    // The page's own "next" link, there at every width (the sidebar is a drawer below 768 px).
    await page.locator('#nd-page a[href="/docs/agents"]').filter({ visible: true }).last().click();
    await page.waitForURL("**/docs/agents");
    await expect(heading, "the agents page is shown").toHaveText(/agent/i);
    await settle();
    const [turn, ...more] = await transitions();
    expect(more, "view transitions after the page turn").toEqual([]);
    expect(turn?.aborted, "an aborted page turn").toBeUndefined();
    expect(turn?.classes, "the page turn").toEqual(["page-turn"]);
    // The turn takes 520 ms (globals.css); under reduced motion it is a swap.
    if (reducedMotion === "no-preference") expect(turn?.length).toBeGreaterThan(400);
    else expect(turn?.length).toBeDefined();

    // A full-page capture resizes the viewport: there is no transition left for it to abort.
    await page.screenshot({ fullPage: true });
    await page.goBack();
    await page.waitForURL("**/docs/theming");
    await expect(heading, "the theming page is shown").toHaveText(/theming/i);
    await settle();
    await page.screenshot({ fullPage: true });
    const aborted = (await transitions()).filter((transition) => transition.aborted);
    expect(aborted, "aborted view transitions").toEqual([]);
    expect(errors).toEqual([]);
  });
}

// Batch 10's docs layout (Task 162): each component page is a sidebar folder of its variants,
// whose links scroll to the variant cards' `#c-<component>-<n>` headers, and the page footer
// steps between pages only. Below 768 px the sidebar is Fumadocs' drawer (`#nd-sidebar-mobile`),
// opened from the header's trigger; from 768 px it is `#nd-sidebar`.

/** A component's variants as the docs show them, from its variants.json (`pnpm gen:variants`). */
const docVariants = (component: string) =>
  variantMeta.filter((variant) => variant.component === component);

/** Loads a docs page and waits until it is hydrated: the drawer's trigger works only then. */
async function openDocsPage(page: Page, path: string) {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await waitForInk(page);
  await page.waitForLoadState("networkidle");
}

/** The sidebar to click in: the desktop one, or the phone drawer, opened. */
async function openSidebar(page: Page, phone: boolean) {
  if (!phone) return page.locator("#nd-sidebar");
  await page.locator('#nd-subnav [aria-controls="nd-sidebar-mobile"]').click();
  const drawer = page.locator("#nd-sidebar-mobile");
  await expect(drawer).toBeVisible();
  return drawer;
}

/** The docs page on screen (cacheComponents keeps the one before it, hidden). */
const visibleDocsPage = (page: Page) => page.locator("#nd-page").filter({ visible: true });

test("a sidebar variant link scrolls its card to the top", async ({ page }, testInfo) => {
  const phone = testInfo.project.name === "w360";
  await openDocsPage(page, "/docs/components/stamp");
  const { label, name } = docVariants("stamp")[2];
  const sidebar = await openSidebar(page, phone);
  const link = sidebar.locator(`a[href="/docs/components/stamp#${name}"]`);
  await expect(link).toHaveText(label);
  await link.click();
  await page.waitForURL(`**/docs/components/stamp#${name}`);
  // On a phone the link scrolls the page under the drawer, which closes on the click
  // (components/docs/close-drawer-on-hash.tsx): Fumadocs only closes it on a new pathname.
  if (phone) await expect(page.locator("#nd-sidebar-mobile")).toBeHidden();
  const heading = page.locator(`#${name}`);
  await expect(heading).toHaveText(label);
  // `scroll-mt-24` keeps the header just below the sticky bars. Before the click it sat far down
  // the page, so only a header inside the band shows that the page scrolled to it.
  const top = () => heading.evaluate((node) => Math.round(node.getBoundingClientRect().top));
  await expect
    .poll(async () => {
      const y = await top();
      return y >= 0 && y <= 140 ? "near the top" : `${y}px from the top`;
    }, "the card's header")
    .toBe("near the top");
});

// The card header stacks its label and title over the chip on a phone: the chip must not push
// the row past the screen.
test("variant card headers fit a phone's width", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "w360", "the phone layout");
  await openDocsPage(page, "/docs/components/stamp");
  const chips = page.locator('[data-slot="variant-card"] [data-slot="copy-install-chip"]');
  const installable = docVariants("stamp").filter((variant) => variant.installable);
  expect(installable.length, "stamp variants with a chip").toBeGreaterThan(0);
  await expect(chips).toHaveCount(installable.length);
  for (const chip of await chips.all()) await expect(chip).toBeVisible();
  await expect(chips.first()).toHaveAccessibleName(/^Copy the install command for @mangacn\/c-/);
  const past = await chips.evaluateAll((nodes) =>
    nodes
      .filter((node) => node.getBoundingClientRect().right > window.innerWidth)
      .map((node) => node.getAttribute("aria-label")),
  );
  expect(past, "chips past the viewport's right edge").toEqual([]);
  const [width, viewport] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    window.innerWidth,
  ]);
  expect(width, "no horizontal overflow").toBeLessThanOrEqual(viewport);
});

// The footer's previous and next come from the docs tree, not the sidebar's, whose variant
// anchors would make "next" a `#c-` link into the same page.
test("the docs footer steps between pages, never into variant anchors", async ({ page }) => {
  /** The footer's links: the page's last block, a grid of previous and next. */
  const footerLinks = async () => {
    const links = visibleDocsPage(page).locator(":scope > :last-child > a");
    await expect(links).toHaveCount(2);
    return links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  };

  await openDocsPage(page, "/docs/components/button");
  expect(await footerLinks()).toEqual(["/docs/components", "/docs/components/badge"]);

  // A page in the middle of the Components folder, its neighbours read from the folder's order.
  const meta = JSON.parse(
    readFileSync(resolve(__dirname, "../content/docs/components/meta.json"), "utf8"),
  ) as { pages: string[] };
  const names = meta.pages.filter((name) => !name.startsWith("---"));
  const middle = Math.floor(names.length / 2);
  await openDocsPage(page, `/docs/components/${names[middle]}`);
  expect(await footerLinks()).toEqual([
    `/docs/components/${names[middle - 1]}`,
    `/docs/components/${names[middle + 1]}`,
  ]);
});

// Fumadocs' type table wrote an opened row's id to the URL with `history.replaceState(null, …)`,
// and after a client-side navigation that made Next.js scroll to the top on the first row opened.
// The rows have no ids now (components/docs/props-table.tsx): opening one leaves the URL and the
// scroll position alone.
test("opening a props row after a client-side navigation keeps the scroll", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "w360";
  await openDocsPage(page, "/docs/components/speech-bubble");
  // A marker on the window survives only a client-side navigation.
  await page.evaluate(() => Object.assign(window, { __sameDocument: true }));
  const sidebar = await openSidebar(page, phone);
  await sidebar.locator('a[href="/docs/components/stamp"]').click();
  await page.waitForURL("**/docs/components/stamp");
  await expect(visibleDocsPage(page).locator("h1")).toHaveText(/stamp/i);
  expect(await page.evaluate(() => "__sameDocument" in window), "a client-side navigation").toBe(
    true,
  );
  await waitForInk(page);
  await page.waitForLoadState("networkidle");

  const row = visibleDocsPage(page)
    .locator('[data-slot="props-table"] button[aria-expanded]')
    .first();
  await row.scrollIntoViewIfNeeded();
  const url = page.url();
  const before = await page.evaluate(() => window.scrollY);
  expect(before, "the props table is below the first screen").toBeGreaterThan(0);
  await row.click();
  await expect(row).toHaveAttribute("aria-expanded", "true");
  // The jump came from Next.js reacting to the history update, a few frames later: watch the
  // position for half a second.
  const moved = await page.evaluate(
    (start) =>
      new Promise<number>((done) => {
        let far = 0;
        const end = performance.now() + 500;
        const watch = () => {
          far = Math.max(far, Math.abs(window.scrollY - start));
          if (performance.now() < end) requestAnimationFrame(watch);
          else done(far);
        };
        watch();
      }),
    before,
  );
  expect(moved, "how far the page scrolled after opening the row").toBeLessThanOrEqual(1);
  expect(page.url(), "the URL after opening the row").toBe(url);
});
