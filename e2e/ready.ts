import { expect, type Frame, type Page } from "@playwright/test";

/**
 * Holds the page's scripts until the server HTML is parsed and every streamed Suspense boundary
 * is revealed, so the app always hydrates that HTML instead of rendering part of it anew.
 *
 * A docs page streams its content as a Suspense boundary that React's inline script reveals,
 * and React delays that reveal by up to 300 ms when the browser painted a frame while parsing
 * (a slow runner does, a fast machine does not). If the app hydrates inside that window, the
 * providers above the content (next-themes, the Fumadocs sidebar) update after mount, and an
 * update reaching a boundary still waiting for its reveal makes React render the boundary on the
 * client. Client-rendered components get `useId` values from a counter instead of their place
 * in the tree, so every InkFrame on the page gets another seed and another wobble (two states
 * of one docs shot between runs of one commit, Task 97). Both are finished drawings a reader may
 * get; a shot needs the one that hydration gives. Call it before `page.goto`.
 */
export async function hydrateAfterReveal(page: Page): Promise<void> {
  let revealed: Promise<unknown> | undefined;
  await page.route(
    (url) => url.pathname.startsWith("/_next/static/") && url.pathname.endsWith(".js"),
    async (route) => {
      // One wait per document: the frame navigates once per test.
      revealed ??= page
        .waitForFunction(
          () =>
            document.readyState !== "loading" &&
            document.querySelector('template[id^="B:"], div[hidden][id^="S:"]') === null,
          undefined,
          { polling: 10 },
        )
        .catch(() => undefined);
      await revealed;
      await route.continue();
    },
  );
}

/** Everything rough.js draws after hydration, stamping `data-inked="true"` when it has. */
const INKED_SLOTS = ["ink-frame", "ink-mark", "ink-arrow", "stamp", "ink-splatter"];

/**
 * Waits until a page (or an iframe's frame) is safe to snapshot: web fonts loaded, every
 * visible InkFrame, ink mark, ink arrow, stamp and ink splatter drawn by rough.js (the last
 * three draw on the server too; `data-inked` says they re-read the theme's pen), and every
 * drawing measured against the box it now covers.
 */
export async function waitForInk(target: Page | Frame): Promise<void> {
  const frame = "mainFrame" in target ? target.mainFrame() : target;
  await frame.evaluate(() => document.fonts.ready);
  // sonner adds a toast one task after `toast()` (a demo calls it in a mount effect) and the
  // Toaster portals its frame into it a render later: let that task run, then wait until every
  // toast on the page is mounted and has its frame, so the checks below see the frame.
  await frame.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)));
  await frame.waitForFunction(() =>
    [...document.querySelectorAll<HTMLElement>('[data-sonner-toast][data-styled="true"]')].every(
      (toast) =>
        toast.dataset.mounted === "true" &&
        toast.querySelector(':scope > [data-slot="ink-frame"]') !== null,
    ),
  );
  // InkFrame shows a CSS fallback until rough.js has drawn; never snapshot that frame. A
  // drawing in content the browser is skipping is left out: stock's message-scroller items
  // are `content-visibility: auto`, so a message scrolled out of its thread is not rendered,
  // its frame gets no resize callback and cannot draw until it is shown, and it is in no shot.
  await expect
    .poll(
      () =>
        frame.evaluate(
          (selector) =>
            [...document.querySelectorAll<HTMLElement>(selector)].filter(
              (node) =>
                node.getClientRects().length > 0 &&
                node.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true }),
            ).length,
          INKED_SLOTS.map((slot) => `[data-slot="${slot}"]:not([data-inked="true"])`).join(", "),
        ),
      { message: "visible drawings rough.js has not drawn" },
    )
    .toBe(0);
  // A web font swap after the first drawing resizes the box; wait until every drawing was
  // measured against the box it now covers, so no frame is captured mid-redraw. The layout
  // box, not the client rect: a tilted panel's rect is the rotated bounds, the drawing is not.
  await frame.waitForFunction(() =>
    [...document.querySelectorAll<HTMLElement>('[data-slot="ink-frame"][data-inked="true"]')]
      .filter(
        (host) =>
          host.getClientRects().length > 0 && host.checkVisibility({ contentVisibilityAuto: true }),
      )
      .every((host) => {
        const [width, height] = (host.dataset.inkSize ?? "").split("x").map(Number);
        return Math.abs(width - host.offsetWidth) < 1 && Math.abs(height - host.offsetHeight) < 1;
      }),
  );
  // An ink mark is measured from the text's line boxes (client rects), so it is compared with
  // them: the same number of lines and the same bounds.
  await frame.waitForFunction(() =>
    [...document.querySelectorAll<HTMLElement>('[data-slot="ink-mark"][data-inked="true"]')].every(
      (mark) => {
        const rects = [...mark.getClientRects()].filter(
          (rect) => rect.width > 0 && rect.height > 0,
        );
        if (rects.length === 0) return true;
        const [width, height] = (mark.dataset.inkSize ?? "").split("x").map(Number);
        const left = Math.min(...rects.map((rect) => rect.left));
        const top = Math.min(...rects.map((rect) => rect.top));
        const right = Math.max(...rects.map((rect) => rect.right));
        const bottom = Math.max(...rects.map((rect) => rect.bottom));
        return (
          Number(mark.dataset.inkLines) === rects.length &&
          Math.abs(width - (right - left)) < 1 &&
          Math.abs(height - (bottom - top)) < 1
        );
      },
    ),
  );
}
