import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { Badge, badgeVariants } from "./badge";
import BadgeDefaultDemo from "./demos/default";

afterEach(cleanup);

const frameOf = (element: HTMLElement) =>
  element.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Badge", () => {
  it("renders a span with data-slot and a forwarded className", () => {
    render(<Badge className="custom-class">New</Badge>);
    const badge = screen.getByText("New");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.getAttribute("data-slot")).toBe("badge");
    expect(badge.getAttribute("data-variant")).toBe("default");
    expect(badge.classList.contains("custom-class")).toBe(true);
  });

  it("draws through an InkFrame layer instead of a CSS border, unclipped", () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText("New");
    for (const name of badge.classList) {
      expect(name, name).not.toMatch(/border-\[length|border-border|^overflow-hidden$/);
    }
    for (const name of ["relative", "isolate", "border-0"]) {
      expect(badge.classList.contains(name), name).toBe(true);
    }
    expect(frameOf(badge)?.getAttribute("data-fill")).toBe("ink");
  });

  it.each([
    ["secondary", "tone"],
    ["outline", "paper"],
    ["destructive", "paper"],
    ["spot", "ink"],
  ] as const)("draws the %s variant with a %s fill", (variant, fill) => {
    render(<Badge variant={variant}>x</Badge>);
    expect(frameOf(screen.getByText("x"))?.getAttribute("data-fill")).toBe(fill);
  });

  it.each(["ghost", "link"] as const)("draws no frame for %s", (variant) => {
    render(<Badge variant={variant}>x</Badge>);
    expect(frameOf(screen.getByText("x"))).toBeNull();
  });

  it("maps the spot variant to a spot fill and spot ink", () => {
    render(<Badge variant="spot">Hot</Badge>);
    const badge = screen.getByText("Hot");
    expect(badge.getAttribute("data-variant")).toBe("spot");
    for (const name of ["bg-spot", "text-spot-foreground", "[--ink:var(--spot)]"]) {
      expect(badge.classList.contains(name), name).toBe(true);
    }
    expect(badgeVariants({ variant: "destructive" })).toContain("[--ink:var(--destructive)]");
  });

  it("renders into another element through render, keeping the frame", () => {
    render(<Badge render={<a href="#chapter-12" />}>Chapter 12</Badge>);
    const link = screen.getByRole("link", { name: "Chapter 12" });
    expect(link.getAttribute("data-slot")).toBe("badge");
    expect(frameOf(link)).not.toBeNull();
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<BadgeDefaultDemo />);
  });
});
