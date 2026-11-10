import { act, renderHook } from "@testing-library/react";
import type * as React from "react";
import { describe, expect, it, vi } from "vitest";
import {
  spreadAnnouncement,
  spreadIndexOf,
  spreadPages,
  spreadSides,
  spreadStarts,
  useSpread,
} from "./use-spread";

/** A keydown as the region receives it. */
function key(name: string, modifiers: Partial<React.KeyboardEvent> = {}) {
  return { key: name, preventDefault: vi.fn(), ...modifiers } as unknown as React.KeyboardEvent;
}

describe("spread helpers", () => {
  it("opens with the first page alone, then pairs from even page numbers, the last even page alone", () => {
    expect(spreadStarts(6)).toEqual([0, 1, 3, 5]);
    expect(spreadStarts(5)).toEqual([0, 1, 3]);
    expect(spreadPages(0, 6)).toEqual([0]);
    expect(spreadPages(3, 6)).toEqual([3, 4]);
    expect(spreadPages(5, 6)).toEqual([5]);
    expect(spreadPages(3, 5)).toEqual([3, 4]);
  });

  it("pages one at a time with single, and has nothing for an empty book", () => {
    expect(spreadStarts(3, true)).toEqual([0, 1, 2]);
    expect(spreadPages(1, 3, true)).toEqual([1]);
    expect(spreadStarts(0)).toEqual([]);
    expect(spreadPages(0, 0)).toEqual([]);
    expect(spreadAnnouncement([], 0)).toBe("");
  });

  it("finds the spread that holds a page, clamped to the book", () => {
    expect(spreadIndexOf(4, 24)).toBe(2); // pages 4–5
    expect(spreadIndexOf(3, 24)).toBe(2);
    expect(spreadIndexOf(-5, 24)).toBe(0);
    expect(spreadIndexOf(99, 24)).toBe(12); // page 24 alone
    expect(spreadIndexOf(Number.NaN, 24)).toBe(0);
    expect(spreadIndexOf(4, 24, true)).toBe(4);
    expect(spreadIndexOf(4, 0)).toBe(0);
  });

  it("sets the earlier page on the right in rtl and on the left in ltr", () => {
    // Pages 4–5 (indices 3, 4).
    expect(spreadSides([3, 4], "rtl")).toEqual({ right: 3, left: 4 });
    expect(spreadSides([3, 4], "ltr")).toEqual({ left: 3, right: 4 });
    // The first page faces the cover's inside: on the reading side.
    expect(spreadSides([0], "rtl")).toEqual({ left: 0, right: null });
    expect(spreadSides([0], "ltr")).toEqual({ left: null, right: 0 });
    // A last even page alone sits where an even page always does.
    expect(spreadSides([23], "rtl")).toEqual({ left: null, right: 23 });
    expect(spreadSides([7], "ltr", true)).toEqual({ left: 7, right: null });
  });

  it("announces one page or a range with an en dash", () => {
    expect(spreadAnnouncement([3, 4], 24)).toBe("Pages 4–5 of 24");
    expect(spreadAnnouncement([0], 24)).toBe("Page 1 of 24");
  });
});

describe("useSpread", () => {
  it("opens the spread that holds start and announces it", () => {
    const { result } = renderHook(() => useSpread({ count: 24, start: 4 }));
    expect(result.current.pages).toEqual([3, 4]);
    expect(result.current.announcement).toBe("Pages 4–5 of 24");
    expect(result.current.index).toBe(2);
    expect(result.current.total).toBe(13);
    expect(result.current.direction).toBe("rtl");
  });

  it("pages forward and back within the bounds, calling onChange with the first page", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSpread({ count: 5, onChange }));
    expect(result.current.canPrevious).toBe(false);
    act(() => result.current.previous());
    expect(onChange).not.toHaveBeenCalled();
    act(() => result.current.next());
    expect(result.current.pages).toEqual([1, 2]);
    act(() => result.current.next());
    expect(result.current.pages).toEqual([3, 4]);
    expect(result.current.canNext).toBe(false);
    act(() => result.current.next());
    expect(onChange.mock.calls).toEqual([[1], [3]]);
    act(() => result.current.goToFirst());
    expect(result.current.pages).toEqual([0]);
    act(() => result.current.goToLast());
    act(() => result.current.goTo(2));
    expect(result.current.pages).toEqual([1, 2]);
    expect(onChange.mock.calls.at(-1)).toEqual([1]);
  });

  it("reads Left as next in rtl and Right as next in ltr", () => {
    const rtl = renderHook(() => useSpread({ count: 24, start: 3 }));
    expect(rtl.result.current.nextKey).toBe("ArrowLeft");
    act(() => {
      rtl.result.current.onKeyDown(key("ArrowLeft"));
    });
    expect(rtl.result.current.announcement).toBe("Pages 6–7 of 24");
    act(() => {
      rtl.result.current.onKeyDown(key("ArrowRight"));
    });
    expect(rtl.result.current.announcement).toBe("Pages 4–5 of 24");

    const ltr = renderHook(() => useSpread({ count: 24, start: 3, direction: "ltr" }));
    expect(ltr.result.current.nextKey).toBe("ArrowRight");
    act(() => {
      ltr.result.current.onKeyDown(key("ArrowRight"));
    });
    expect(ltr.result.current.announcement).toBe("Pages 6–7 of 24");
  });

  it("goes to the ends with Home and End, and leaves other and modified keys alone", () => {
    const { result } = renderHook(() => useSpread({ count: 24, start: 10 }));
    const end = key("End");
    act(() => {
      expect(result.current.onKeyDown(end)).toBe(true);
    });
    expect(end.preventDefault).toHaveBeenCalled();
    expect(result.current.announcement).toBe("Page 24 of 24");
    act(() => {
      result.current.onKeyDown(key("Home"));
    });
    expect(result.current.announcement).toBe("Page 1 of 24");

    const other = key("Enter");
    const back = key("ArrowLeft", { altKey: true });
    act(() => {
      expect(result.current.onKeyDown(other)).toBe(false);
      expect(result.current.onKeyDown(back)).toBe(false);
    });
    expect(other.preventDefault).not.toHaveBeenCalled();
    expect(back.preventDefault).not.toHaveBeenCalled();
    expect(result.current.announcement).toBe("Page 1 of 24");
  });

  it("pages one at a time with single and keeps the reader's page when it switches", () => {
    const { result, rerender } = renderHook(
      ({ single }) => useSpread({ count: 24, start: 4, single }),
      { initialProps: { single: true } },
    );
    expect(result.current.pages).toEqual([4]);
    expect(result.current.sides).toEqual({ left: 4, right: null });
    expect(result.current.announcement).toBe("Page 5 of 24");
    act(() => result.current.next());
    expect(result.current.announcement).toBe("Page 6 of 24");
    rerender({ single: false });
    expect(result.current.announcement).toBe("Pages 6–7 of 24");
  });

  it("does nothing for an empty book", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSpread({ count: 0, onChange }));
    expect(result.current.pages).toEqual([]);
    expect(result.current.canNext).toBe(false);
    act(() => {
      result.current.next();
      result.current.goToLast();
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
