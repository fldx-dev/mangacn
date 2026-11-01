import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { SiteFooter } from "./site-footer";

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const hrefs = (name: string) =>
  within(screen.getByRole("navigation", { name }))
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));

describe("SiteFooter", () => {
  it("opens with a hand-drawn rule and carries the licence and the Pro line", () => {
    const { container } = render(<SiteFooter />);
    expect(container.querySelector('footer > div > [data-slot="separator"]')).not.toBeNull();
    expect(screen.getByText(/distributed as a shadcn registry\. MIT\./)).not.toBeNull();
    expect(screen.getByText("Pro: blocks and templates, later.")).not.toBeNull();
  });

  it("links three columns to real pages", () => {
    render(<SiteFooter />);
    expect(hrefs("Docs")).toEqual(["/docs", "/docs/installation", "/docs/theming"]);
    expect(hrefs("Components")).toEqual([
      "/docs/components",
      "/docs/components#category-primitive",
      "/demo",
    ]);
    expect(hrefs("Project")).toEqual([
      "https://github.com/fldx-dev/mangacn",
      "https://github.com/fldx-dev/mangacn/issues",
      "https://github.com/fldx-dev/mangacn/blob/main/LICENSE",
    ]);
  });

  it("has no axe violations", async () => {
    const { container } = render(<SiteFooter />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
