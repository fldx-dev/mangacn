import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { Button, buttonVariants } from "./button";
import ButtonDefaultDemo from "./demos/default";

afterEach(cleanup);

describe("Button", () => {
  it("renders a button with data-slot and a forwarded className", () => {
    render(<Button className="custom-class">Go</Button>);
    const button = screen.getByRole("button", { name: "Go" });
    expect(button.getAttribute("data-slot")).toBe("button");
    expect(button.classList.contains("custom-class")).toBe(true);
  });

  it("draws a 2 px ink border with a hard shadow that presses in", () => {
    render(<Button>Go</Button>);
    const classes = screen.getByRole("button").classList;
    for (const name of [
      "border-[length:var(--outline-width)]",
      "border-border",
      "ink-shadow-sm",
      "active:not-aria-[haspopup]:translate-[1px_1px]",
      "active:not-aria-[haspopup]:shadow-none",
    ]) {
      expect(classes.contains(name), name).toBe(true);
    }
    expect(buttonVariants({ variant: "outline" })).toContain("ink-shadow-sm");
  });

  it("screens disabled buttons with halftone instead of opacity", () => {
    render(<Button disabled>Go</Button>);
    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
    for (const name of [
      "disabled:opacity-100",
      "disabled:halftone-light",
      "disabled:text-muted-foreground",
    ]) {
      expect(button.classList.contains(name), name).toBe(true);
    }
    expect(button.classList.contains("disabled:opacity-50")).toBe(false);
  });

  it("maps the sfx variant to display type and a full ink shadow", () => {
    render(<Button variant="sfx">Dokan!</Button>);
    const classes = screen.getByRole("button").classList;
    for (const name of ["font-display", "uppercase", "ink-shadow", "bg-paper", "text-ink"]) {
      expect(classes.contains(name), name).toBe(true);
    }
    expect(classes.contains("ink-shadow-sm")).toBe(false);
  });

  it("keeps ghost and link borderless", () => {
    expect(buttonVariants({ variant: "ghost" })).toContain("border-transparent");
    expect(buttonVariants({ variant: "link" })).toContain("border-transparent");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<ButtonDefaultDemo />);
  });
});
