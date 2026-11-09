import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { AspectRatio } from "./aspect-ratio";

afterEach(cleanup);

const box = () => document.querySelector<HTMLElement>('[data-slot="aspect-ratio"]');

describe("AspectRatio", () => {
  it("sizes its box to the ratio through --ratio, as stock", () => {
    render(
      <AspectRatio ratio={16 / 9} className="custom-class">
        <span>Cover</span>
      </AspectRatio>,
    );
    expect(box()?.style.getPropertyValue("--ratio")).toBe(String(16 / 9));
    for (const name of ["relative", "aspect-(--ratio)", "custom-class"]) {
      expect(box()?.classList.contains(name), name).toBe(true);
    }
    expect(box()?.textContent).toBe("Cover");
  });

  it("draws nothing of its own", () => {
    render(<AspectRatio ratio={1} />);
    expect(box()?.querySelector('[data-slot="ink-frame"]')).toBeNull();
    expect(box()?.className).not.toMatch(/border|ink-border|shadow|bg-/);
  });

  it("forwards other props", () => {
    render(<AspectRatio ratio={3 / 4} aria-label="Cover" id="cover" />);
    expect(box()?.id).toBe("cover");
    expect(box()?.getAttribute("aria-label")).toBe("Cover");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
