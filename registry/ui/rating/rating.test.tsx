import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { Rating } from "./rating";

afterEach(cleanup);

const states = () =>
  [...document.querySelectorAll<HTMLElement>('[data-slot="rating-item"]')].map(
    (item) => item.dataset.state,
  );
const radio = (name: string) => screen.getByRole("radio", { name });
const press = (target: HTMLElement, key: string) =>
  act(() => {
    fireEvent.keyDown(target, { key });
  });

describe("Rating", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));

  it("is a radio group of named stars with one tab stop on the chosen one", () => {
    render(<Rating aria-label="Rating" defaultValue={3} className="custom" />);
    const group = screen.getByRole("radiogroup", { name: "Rating" });
    expect(group.dataset.slot).toBe("rating");
    expect(group.classList.contains("custom")).toBe(true);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(5);
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, -1, 0, -1, -1]);
    expect(radio("3 of 5 stars").getAttribute("aria-checked")).toBe("true");
    expect(states()).toEqual(["full", "full", "full", "empty", "empty"]);
  });

  it("puts the tab stop on the first star when nothing is chosen", () => {
    render(<Rating aria-label="Rating" />);
    expect(screen.getAllByRole("radio").map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1]);
  });

  it("moves and selects with the arrows, Home and End", () => {
    const onValueChange = vi.fn();
    render(<Rating aria-label="Rating" defaultValue={3} onValueChange={onValueChange} />);
    press(radio("3 of 5 stars"), "ArrowRight");
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    expect(document.activeElement).toBe(radio("4 of 5 stars"));
    press(radio("4 of 5 stars"), "ArrowUp");
    expect(onValueChange).toHaveBeenLastCalledWith(5);
    press(radio("5 of 5 stars"), "ArrowLeft");
    press(radio("4 of 5 stars"), "ArrowDown");
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    press(radio("3 of 5 stars"), "Home");
    expect(document.activeElement).toBe(radio("1 of 5 stars"));
    press(radio("1 of 5 stars"), "End");
    expect(onValueChange).toHaveBeenLastCalledWith(5);
    expect(radio("5 of 5 stars").tabIndex).toBe(0);
  });

  it("selects the focused star with Space, and a star on click", () => {
    const onValueChange = vi.fn();
    render(<Rating aria-label="Rating" onValueChange={onValueChange} />);
    press(radio("1 of 5 stars"), " ");
    expect(onValueChange).toHaveBeenLastCalledWith(1);
    fireEvent.click(radio("4 of 5 stars"));
    expect(onValueChange).toHaveBeenLastCalledWith(4);
  });

  it("takes half steps: two radios per star, a clipped half star", () => {
    render(<Rating aria-label="Rating" step={0.5} defaultValue={2.5} />);
    expect(screen.getAllByRole("radio")).toHaveLength(10);
    expect(states()).toEqual(["full", "full", "half", "empty", "empty"]);
    // Half filled by a clip, not a gradient.
    expect(document.querySelector('[data-state="half"] [class*="clip-path"]')).not.toBeNull();
    press(radio("2.5 of 5 stars"), "ArrowRight");
    expect(radio("3 of 5 stars").getAttribute("aria-checked")).toBe("true");
  });

  it("previews on hover without committing", () => {
    const onValueChange = vi.fn();
    render(<Rating aria-label="Rating" defaultValue={1} onValueChange={onValueChange} />);
    fireEvent.pointerEnter(radio("4 of 5 stars"));
    expect(states()).toEqual(["full", "full", "full", "full", "empty"]);
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.pointerLeave(screen.getByRole("radiogroup"));
    expect(states()).toEqual(["full", "empty", "empty", "empty", "empty"]);
  });

  it("is controlled with value", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Rating aria-label="Rating" value={2} onValueChange={onValueChange} />,
    );
    fireEvent.click(radio("5 of 5 stars"));
    expect(onValueChange).toHaveBeenCalledWith(5);
    expect(radio("2 of 5 stars").getAttribute("aria-checked")).toBe("true");
    rerender(<Rating aria-label="Rating" value={5} onValueChange={onValueChange} />);
    expect(radio("5 of 5 stars").getAttribute("aria-checked")).toBe("true");
  });

  it("is one image named by its value when read-only, with no focus", () => {
    render(<Rating value={4.5} readOnly />);
    const image = screen.getByRole("img", { name: "Rated 4.5 out of 5" });
    expect(image.dataset.readonly).toBe("");
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(image.querySelector("[tabindex]")).toBeNull();
    expect(states()).toEqual(["full", "full", "full", "full", "half"]);
  });

  it("ignores input when disabled and takes no focus", () => {
    const onValueChange = vi.fn();
    render(<Rating aria-label="Rating" disabled defaultValue={2} onValueChange={onValueChange} />);
    expect(screen.getAllByRole("radio").every((r) => r.tabIndex === -1)).toBe(true);
    fireEvent.click(radio("4 of 5 stars"));
    press(radio("2 of 5 stars"), "ArrowRight");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("posts its value under name", () => {
    render(
      <form data-testid="form">
        <Rating aria-label="Rating" name="rating" defaultValue={4} />
      </form>,
    );
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.get("rating")).toBe("4");
  });

  it("posts nothing when disabled, as a native disabled control", () => {
    render(
      <form data-testid="form">
        <Rating aria-label="Rating" name="rating" defaultValue={4} disabled />
      </form>,
    );
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.has("rating")).toBe(false);
  });

  it("keeps its role when a caller passes one", () => {
    render(<Rating aria-label="Rating" role="group" />);
    expect(screen.getByRole("radiogroup")).toBeTruthy();
  });

  it("takes its words from labels and max", () => {
    const { rerender } = render(
      <Rating aria-label="Rating" max={3} labels={{ item: (n, max) => `${n}/${max}` }} />,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(radio("2/3")).toBeTruthy();
    rerender(<Rating value={2} max={3} readOnly labels={{ readOnly: (v) => `星${v}つ` }} />);
    expect(screen.getByRole("img", { name: "星2つ" })).toBeTruthy();
  });

  it("puts id, aria-invalid and aria-describedby on the group for field", () => {
    render(<Rating id="r" aria-label="Rating" aria-invalid="true" aria-describedby="r-error" />);
    const group = screen.getByRole("radiogroup");
    expect(group.id).toBe("r");
    expect(group.getAttribute("aria-invalid")).toBe("true");
    expect(group.getAttribute("aria-describedby")).toBe("r-error");
  });

  it("keeps a 44 px hit area per star at default and lg", () => {
    const { rerender } = render(<Rating aria-label="Rating" />);
    const item = () => document.querySelector<HTMLElement>('[data-slot="rating-item"]');
    expect(item()?.className).toContain("size-11");
    rerender(<Rating aria-label="Rating" size="lg" />);
    expect(item()?.className).toContain("size-12");
  });
});
