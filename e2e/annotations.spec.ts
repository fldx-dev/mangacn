import { expect, test } from "@playwright/test";
import { waitForInk } from "./ready";

// Annotations never change layout (SPEC-components-2 §3): the line boxes of a wrapped ink mark
// are the same with and without its drawing, and every line box gets its own mark.
test("a wrapped ink mark draws one mark per line and leaves the text where it was", async ({
  page,
}) => {
  await page.goto("/demo/ink-mark/wrapped");
  await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
  await waitForInk(page);

  const result = await page.evaluate(() => {
    const mark = document.querySelector<HTMLElement>('[data-slot="ink-mark"]');
    const paragraph = mark?.closest("p");
    const svg = mark?.querySelector("svg");
    if (!mark || !paragraph || !svg) return null;
    const boxes = () => ({
      lines: [...mark.getClientRects()].map((rect) =>
        [rect.left, rect.top, rect.width, rect.height].map((n) => n.toFixed(2)).join(" "),
      ),
      paragraph: [paragraph.offsetWidth, paragraph.offsetHeight],
    });
    const marked = boxes();
    const drawn = mark.querySelectorAll('[data-slot="ink-mark-line"]').length;
    // The same text without the mark: no drawing and none of the span's own classes.
    svg.style.display = "none";
    const classes = mark.className;
    mark.className = "";
    const plain = boxes();
    svg.style.display = "";
    mark.className = classes;
    return { marked, plain, drawn };
  });

  expect(result).not.toBeNull();
  expect(result?.marked.lines.length).toBeGreaterThan(1);
  expect(result?.drawn).toBe(result?.marked.lines.length);
  expect(result?.marked).toEqual(result?.plain);
});
