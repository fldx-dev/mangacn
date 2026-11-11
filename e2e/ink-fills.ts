import type { Page } from "@playwright/test";

/**
 * Lets axe's `color-contrast` measure text over the pen's drawings. An InkFrame paints its fill
 * as an SVG (rough.js) and clears its own CSS background once drawn, and most primitives draw
 * their frame as a childless `absolute -z-1` layer under their content. axe reads only CSS
 * backgrounds and, in 4.14, ranks a negative-z child above its non-positioned siblings (when
 * one stacking order is a prefix of the other, the longer wins), so it reported almost every
 * piece of text on a stage as "overlapped" and measured none of it.
 *
 * So, for the contrast check only: every drawing is hidden, and each solid fill it painted
 * (`paper`, `ink`, `tone`, the colours `InkFrame` draws with) is set as the same CSS colour on
 * the box it covered: the frame itself when it wraps content, else the host its layer fills.
 * The custom properties resolve where the drawing read them, so a host's `--ink` or `--paper`
 * override still applies. `data-inked` stays, so no host falls back to its pre-drawing styles
 * (the destructive button's fallback is a tint; drawn, it fills with paper). A `hatch` fill is
 * a pattern and stays drawn: axe reports text over it as unmeasurable, which it is. Transitions
 * are off on each painted box, so axe reads the settled colour. Call it after every other
 * check: the page no longer looks as it was shot.
 */
export async function paintInkFillsAsCss(page: Page): Promise<void> {
  await page.evaluate(() => {
    const fills: Record<string, string> = {
      paper: "var(--paper)",
      ink: "var(--ink)",
      tone: "var(--tone-2)",
    };
    for (const frame of document.querySelectorAll<HTMLElement>('[data-slot="ink-frame"]')) {
      const fill = frame.dataset.fill ?? "none";
      if (fill === "hatch") continue;
      const drawing = frame.querySelector<SVGSVGElement>(":scope > svg");
      if (drawing) drawing.style.display = "none";
      const color = fills[fill];
      if (!color || getComputedStyle(frame).display === "none") continue;
      const layer = frame.children.length === 1 && !frame.textContent?.trim();
      const box = layer ? frame.parentElement : frame;
      if (layer) frame.style.display = "none";
      // In the same style change, so a host that transitions its background (a badge) does not
      // fade in from transparent while axe reads it.
      box?.style.setProperty("transition", "none", "important");
      box?.style.setProperty("background-color", color, "important");
    }
  });
}
