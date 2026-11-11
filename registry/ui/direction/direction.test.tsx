import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { DirectionProvider, useDirection } from "./direction";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Reader() {
  return <span>{useDirection()}</span>;
}

describe("DirectionProvider", () => {
  it("defaults to left to right", () => {
    render(<Reader />);
    expect(screen.getByText("ltr")).toBeTruthy();
  });

  it("hands its direction to the components inside it", () => {
    render(
      <DirectionProvider direction="rtl">
        <Reader />
      </DirectionProvider>,
    );
    expect(screen.getByText("rtl")).toBeTruthy();
  });

  it("draws nothing of its own", () => {
    const { container } = render(
      <DirectionProvider direction="rtl">
        <p>Text</p>
      </DirectionProvider>,
    );
    expect(container.innerHTML).toBe("<p>Text</p>");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
