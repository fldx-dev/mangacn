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
  it("closes the chapter on a stamped last page that points at the docs, with the licence", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("heading", { level: 2, name: "End of chapter one." })).not.toBeNull();
    expect(screen.getByRole("link", { name: "Turn to the docs" }).getAttribute("href")).toBe(
      "/docs",
    );
    expect(screen.getByText("完").closest("[lang='ja']")).not.toBeNull();
    expect(screen.getByText(/distributed as a shadcn registry\. MIT\./)).not.toBeNull();
  });

  it("links three columns to real pages", () => {
    render(<SiteFooter />);
    expect(hrefs("Docs")).toEqual(["/docs", "/docs/installation", "/docs/theming", "/docs/agents"]);
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
