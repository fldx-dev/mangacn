import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { Badge, badgeVariants } from "./badge";
import BadgeDefaultDemo from "./demos/default";

afterEach(cleanup);

describe("Badge", () => {
  it("renders a span with data-slot and a forwarded className", () => {
    render(<Badge className="custom-class">New</Badge>);
    const badge = screen.getByText("New");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.getAttribute("data-slot")).toBe("badge");
    expect(badge.getAttribute("data-variant")).toBe("default");
    expect(badge.classList.contains("custom-class")).toBe(true);
  });

  it("draws a 2 px ink border", () => {
    render(<Badge>New</Badge>);
    const classes = screen.getByText("New").classList;
    expect(classes.contains("border-[length:var(--outline-width)]")).toBe(true);
    expect(classes.contains("border-border")).toBe(true);
  });

  it("maps the spot variant to the spot fill", () => {
    render(<Badge variant="spot">Hot</Badge>);
    const badge = screen.getByText("Hot");
    expect(badge.getAttribute("data-variant")).toBe("spot");
    expect(badge.classList.contains("bg-spot")).toBe(true);
    expect(badge.classList.contains("text-spot-foreground")).toBe(true);
    expect(badgeVariants({ variant: "destructive" })).toContain("border-destructive");
  });

  it("renders into another element through render", () => {
    render(<Badge render={<a href="#chapter-12" />}>Chapter 12</Badge>);
    const link = screen.getByRole("link", { name: "Chapter 12" });
    expect(link.getAttribute("data-slot")).toBe("badge");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<BadgeDefaultDemo />);
  });
});
