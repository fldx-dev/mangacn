import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import VerticalTextDefaultDemo from "./demos/default";
import { VerticalText } from "./vertical-text";

afterEach(cleanup);

describe("VerticalText", () => {
  it("renders real text in vertical-rl with data-slot and a forwarded className", () => {
    render(<VerticalText className="custom-class">縦書き</VerticalText>);
    const text = screen.getByText("縦書き");
    expect(text.tagName).toBe("SPAN");
    expect(text.dataset.slot).toBe("vertical-text");
    for (const name of ["custom-class", "[writing-mode:vertical-rl]"]) {
      expect(text.classList.contains(name), name).toBe(true);
    }
  });

  it.each(["mixed", "upright", "sideways"] as const)("sets text-orientation %s", (orientation) => {
    render(<VerticalText orientation={orientation}>東京</VerticalText>);
    const text = screen.getByText("東京");
    expect(text.dataset.orientation).toBe(orientation);
    expect(text.classList.contains(`[text-orientation:${orientation}]`)).toBe(true);
  });

  it("defaults to mixed and passes lang through", () => {
    render(<VerticalText lang="ja">東京</VerticalText>);
    const text = screen.getByText("東京");
    expect(text.dataset.orientation).toBe("mixed");
    expect(text.getAttribute("lang")).toBe("ja");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<VerticalTextDefaultDemo />);
  });
});
