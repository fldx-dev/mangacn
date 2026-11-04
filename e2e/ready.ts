import { expect, type Frame, type Page } from "@playwright/test";

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
  // InkFrame shows a CSS fallback until rough.js has drawn; never snapshot that frame.
  await expect(
    frame
      .locator(
        INKED_SLOTS.map((slot) => `[data-slot="${slot}"]:not([data-inked="true"])`).join(", "),
      )
      .filter({ visible: true }),
  ).toHaveCount(0);
  // A web font swap after the first drawing resizes the box; wait until every drawing was
  // measured against the box it now covers, so no frame is captured mid-redraw. The layout
  // box, not the client rect: a tilted panel's rect is the rotated bounds, the drawing is not.
  await frame.waitForFunction(() =>
    [...document.querySelectorAll<HTMLElement>('[data-slot="ink-frame"][data-inked="true"]')]
      .filter((host) => host.getClientRects().length > 0)
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
