import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import BreadcrumbDefaultDemo from "./demos/default";
import BreadcrumbEllipsisDemo from "./demos/ellipsis";
import BreadcrumbLongDemo from "./demos/long";

afterEach(cleanup);

describe("Breadcrumb", () => {
  it("keeps every stock part, data-slot and forwarded className", () => {
    render(
      <Breadcrumb className="c-nav">
        <BreadcrumbList className="c-list">
          <BreadcrumbItem className="c-item">
            <BreadcrumbLink href="/" className="c-link">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="c-separator" />
          <BreadcrumbItem>
            <BreadcrumbEllipsis className="c-ellipsis" />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="c-page">Chapter 12</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const nav = screen.getByRole("navigation", { name: "breadcrumb" });
    for (const [slot, name] of [
      ["breadcrumb", "c-nav"],
      ["breadcrumb-list", "c-list"],
      ["breadcrumb-item", "c-item"],
      ["breadcrumb-link", "c-link"],
      ["breadcrumb-separator", "c-separator"],
      ["breadcrumb-ellipsis", "c-ellipsis"],
      ["breadcrumb-page", "c-page"],
    ]) {
      const part =
        (nav.matches(`[data-slot="${slot}"]`) ? nav : null) ??
        nav.querySelector(`[data-slot="${slot}"]`);
      expect(part, slot).not.toBeNull();
      expect(part?.classList.contains(name), slot).toBe(true);
    }
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
  });

  it("separates crumbs with a hand-inked chevron in the stock icon slot", () => {
    render(
      <ol>
        <BreadcrumbSeparator data-testid="separator" />
      </ol>,
    );
    const separator = screen.getByTestId("separator");
    expect(separator.getAttribute("role")).toBe("presentation");
    expect(separator.getAttribute("aria-hidden")).toBe("true");
    // Same size rule as stock's lucide chevron.
    expect(separator.classList.contains("[&>svg]:size-3.5")).toBe(true);
    const svg = separator.querySelector(":scope > svg");
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.querySelectorAll("path")).toHaveLength(1);
    // Not lucide's icon any more.
    expect(svg?.classList.contains("lucide")).toBe(false);
  });

  it("lets children replace the chevron", () => {
    render(
      <ol>
        <BreadcrumbSeparator data-testid="separator">/</BreadcrumbSeparator>
      </ol>,
    );
    const separator = screen.getByTestId("separator");
    expect(separator.textContent).toBe("/");
    expect(separator.querySelector("svg")).toBeNull();
  });

  it("sets the current page in the display face", () => {
    render(<BreadcrumbPage>Chapter 12</BreadcrumbPage>);
    const page = screen.getByText("Chapter 12");
    expect(page.getAttribute("aria-current")).toBe("page");
    expect(page.getAttribute("aria-disabled")).toBe("true");
    expect(page.getAttribute("role")).toBe("link");
    for (const name of ["font-display", "font-normal", "text-foreground"]) {
      expect(page.classList.contains(name), name).toBe(true);
    }
  });

  it("keeps the ellipsis with its screen-reader text", () => {
    render(<BreadcrumbEllipsis data-testid="ellipsis" />);
    const ellipsis = screen.getByTestId("ellipsis");
    expect(ellipsis.getAttribute("aria-hidden")).toBe("true");
    expect(ellipsis.querySelector("svg")).not.toBeNull();
    expect(ellipsis.querySelector(".sr-only")?.textContent).toBe("More");
  });

  it("renders a link through `render` and keeps its data-slot", () => {
    render(
      <BreadcrumbLink render={<a href="/docs" aria-label="Docs home" />}>Docs</BreadcrumbLink>,
    );
    const link = screen.getByRole("link", { name: "Docs home" });
    expect(link.getAttribute("data-slot")).toBe("breadcrumb-link");
    expect(link.classList.contains("hover:text-foreground")).toBe(true);
  });

  it("lets a long trail wrap", () => {
    render(<BreadcrumbLongDemo />);
    const list = document.querySelector('[data-slot="breadcrumb-list"]');
    expect(list?.classList.contains("flex-wrap")).toBe(true);
    expect(list?.querySelectorAll('[data-slot="breadcrumb-item"]')).toHaveLength(6);
    expect(screen.getByText("夜の街").getAttribute("lang")).toBe("ja");
  });

  it("has no axe violations in its demos", async () => {
    await expectNoA11yViolations(<BreadcrumbDefaultDemo />);
    await expectNoA11yViolations(<BreadcrumbLongDemo />);
    await expectNoA11yViolations(<BreadcrumbEllipsisDemo />);
  });
});
