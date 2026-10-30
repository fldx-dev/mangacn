import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import SeparatorDefaultDemo from "./demos/default";
import { Separator } from "./separator";

afterEach(cleanup);

describe("Separator", () => {
  it("renders a horizontal separator with data-slot and a forwarded className", () => {
    render(<Separator className="custom-class" />);
    const separator = screen.getByRole("separator");
    expect(separator.getAttribute("data-slot")).toBe("separator");
    expect(separator.getAttribute("aria-orientation")).toBe("horizontal");
    expect(separator.classList.contains("custom-class")).toBe(true);
  });

  it("is an outline-width ink rule in both orientations", () => {
    render(<Separator orientation="vertical" />);
    const separator = screen.getByRole("separator");
    expect(separator.getAttribute("aria-orientation")).toBe("vertical");
    for (const name of [
      "bg-border",
      "data-horizontal:h-(--outline-width)",
      "data-vertical:w-(--outline-width)",
    ]) {
      expect(separator.classList.contains(name), name).toBe(true);
    }
    expect(separator.classList.contains("data-horizontal:h-px")).toBe(false);
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<SeparatorDefaultDemo />);
  });
});
