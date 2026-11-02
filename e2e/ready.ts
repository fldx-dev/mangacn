import { expect, type Frame, type Page } from "@playwright/test";

/**
 * Waits until a page (or an iframe's frame) is safe to snapshot: web fonts loaded, every
 * visible InkFrame drawn by rough.js, and every drawing measured against the box it now covers.
 */
export async function waitForInk(target: Page | Frame): Promise<void> {
  const frame = "mainFrame" in target ? target.mainFrame() : target;
  await frame.evaluate(() => document.fonts.ready);
  // InkFrame shows a CSS fallback until rough.js has drawn; never snapshot that frame.
  await expect(
    frame.locator('[data-slot="ink-frame"]:not([data-inked="true"])').filter({ visible: true }),
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
}
