import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import PageTurnDefaultDemo from "./demos/default";
import { PageTurn } from "./page-turn";

// motion reads `prefers-reduced-motion` through matchMedia (missing in jsdom) once, on first
// use, and caches it for the module; so the whole file runs with reduced motion.
beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(cleanup);

const turnOf = (container: HTMLElement) => container.firstElementChild as HTMLElement;
const pagesOf = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[data-slot="page-turn-page"]');

describe("PageTurn", () => {
  it("renders the page with data-slot, rtl by default and a forwarded className", () => {
    const { container } = render(
      <PageTurn pageKey="a" className="custom-class">
        Page A
      </PageTurn>,
    );
    const turn = turnOf(container);
    expect(turn.dataset.slot).toBe("page-turn");
    expect(turn.dataset.direction).toBe("rtl");
    expect(turn.classList.contains("custom-class")).toBe(true);
    expect(screen.getByText("Page A")).toBeTruthy();
    expect(pagesOf(container)).toHaveLength(1);
  });

  it("hinges an rtl page on its right edge and inks its left edge", () => {
    const { container } = render(<PageTurn pageKey={1}>A</PageTurn>);
    const page = pagesOf(container)[0];
    expect(page.style.transformOrigin).toBe("right center");
    const edge = page.querySelector('[data-slot="page-turn-edge"]');
    expect(edge?.getAttribute("aria-hidden")).toBe("true");
    expect(edge?.classList.contains("left-0")).toBe(true);
    expect(edge?.classList.contains("bg-ink")).toBe(true);
  });

  it("hinges an ltr page on its left edge", () => {
    const { container } = render(
      <PageTurn pageKey={1} direction="ltr">
        A
      </PageTurn>,
    );
    expect(turnOf(container).dataset.direction).toBe("ltr");
    const page = pagesOf(container)[0];
    expect(page.style.transformOrigin).toBe("left center");
    expect(page.querySelector('[data-slot="page-turn-edge"]')?.classList).toContain("right-0");
  });

  it("swaps to the new page when pageKey changes", async () => {
    const { container, rerender } = render(
      <PageTurn pageKey={1} duration={0.05}>
        Page 1
      </PageTurn>,
    );
    rerender(
      <PageTurn pageKey={2} duration={0.05}>
        Page 2
      </PageTurn>,
    );
    expect(screen.getByText("Page 2")).toBeTruthy();
    await waitFor(() => expect(pagesOf(container)).toHaveLength(1));
    expect(screen.queryByText("Page 1")).toBeNull();
  });

  it("keeps the page when pageKey stays the same", () => {
    const { container, rerender } = render(<PageTurn pageKey={1}>Page 1</PageTurn>);
    const before = pagesOf(container)[0];
    rerender(<PageTurn pageKey={1}>Page 1, edited</PageTurn>);
    expect(pagesOf(container)[0]).toBe(before);
    expect(before.textContent).toBe("Page 1, edited");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<PageTurnDefaultDemo />);
  });
});
