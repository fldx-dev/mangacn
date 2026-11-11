import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { readerProgress, readPageParam, useReader, writePageParam } from "./use-reader";

/** An address held in a string, as the demo's history calls hold it in the page's URL. */
function address(search = "") {
  const url = { search, read: vi.fn(() => url.search), write: vi.fn() };
  url.write.mockImplementation((next: string) => {
    url.search = next;
  });
  return url;
}

describe("the page parameter", () => {
  it("reads ?page= from 1 as an index, clamped, and nothing when missing or not a number", () => {
    expect(readPageParam("?page=5", 24)).toBe(4);
    expect(readPageParam("page=1&x=2", 24)).toBe(0);
    expect(readPageParam("?page=99", 24)).toBe(23);
    expect(readPageParam("?page=0", 24)).toBe(0);
    expect(readPageParam("?page=-3", 24)).toBe(0);
    expect(readPageParam("", 24)).toBeUndefined();
    expect(readPageParam("?page=two", 24)).toBeUndefined();
    expect(readPageParam("?page=2.5", 24)).toBeUndefined();
  });

  it("writes the page from 1 and keeps the other parameters", () => {
    expect(writePageParam("", 4)).toBe("?page=5");
    expect(writePageParam("?mode=dark&page=2", 11)).toBe("?mode=dark&page=12");
  });

  it("says the progress in words", () => {
    expect(readerProgress(5, 24)).toBe("Page 5 of 24");
    expect(readerProgress(0, 0)).toBe("");
  });
});

describe("useReader, its own page", () => {
  it("opens at start and counts the last page on screen", () => {
    // Index 3 opens pages 4–5, so the reader is on page 5.
    const { result } = renderHook(() => useReader({ count: 24, start: 3 }));
    expect(result.current.page).toBe(3);
    expect(result.current.current).toBe(5);
    expect(result.current.progress).toBe("Page 5 of 24");
  });

  it("turns, clamped to the chapter, and reports each turn", () => {
    const onPageChange = vi.fn();
    const { result } = renderHook(() => useReader({ count: 24, onPageChange }));
    expect(result.current.progress).toBe("Page 1 of 24");
    act(() => result.current.setPage(5));
    expect(result.current.progress).toBe("Page 7 of 24");
    act(() => result.current.setPage(40));
    expect(result.current.page).toBe(23);
    expect(result.current.progress).toBe("Page 24 of 24");
    expect(onPageChange.mock.calls).toEqual([[5], [23]]);
  });

  it("counts one page at a time with single", () => {
    const { result } = renderHook(() => useReader({ count: 24, start: 3, single: true }));
    expect(result.current.progress).toBe("Page 4 of 24");
  });

  it("has nothing to say for an empty chapter", () => {
    const { result } = renderHook(() => useReader({ count: 0 }));
    expect(result.current.page).toBe(0);
    expect(result.current.progress).toBe("");
  });
});

describe("useReader, controlled", () => {
  it("follows page, and asks onPageChange to turn without moving itself", () => {
    const onPageChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ page }) => useReader({ count: 24, page, onPageChange }),
      { initialProps: { page: 9 } },
    );
    expect(result.current.progress).toBe("Page 11 of 24");
    act(() => result.current.setPage(11));
    expect(onPageChange).toHaveBeenCalledWith(11);
    expect(result.current.page).toBe(9);
    rerender({ page: 11 });
    expect(result.current.progress).toBe("Page 13 of 24");
  });

  it("clamps a page outside the chapter", () => {
    const { result } = renderHook(() => useReader({ count: 24, page: 99 }));
    expect(result.current.page).toBe(23);
  });
});

describe("useReader, the address", () => {
  it("opens at the address's page after mount, over start, and writes nothing then", () => {
    const url = address("?mode=dark&page=10");
    const { result } = renderHook(() => useReader({ count: 24, start: 3, url }));
    expect(result.current.page).toBe(9);
    expect(result.current.progress).toBe("Page 11 of 24");
    expect(url.write).not.toHaveBeenCalled();
  });

  it("keeps start when the address has no page", () => {
    const url = address("?mode=dark");
    const { result } = renderHook(() => useReader({ count: 24, start: 3, url }));
    expect(result.current.page).toBe(3);
  });

  it("writes every turn into the address, other parameters kept", () => {
    const url = address("?mode=dark");
    const { result } = renderHook(() => useReader({ count: 24, url }));
    act(() => result.current.setPage(5));
    expect(url.write).toHaveBeenLastCalledWith("?mode=dark&page=6");
    act(() => result.current.setPage(7));
    expect(url.search).toBe("?mode=dark&page=8");
  });

  it("hands the address's page to the owner of a controlled page", () => {
    const url = address("?page=10");
    const onPageChange = vi.fn();
    renderHook(() => useReader({ count: 24, page: 0, onPageChange, url }));
    expect(onPageChange).toHaveBeenCalledWith(9);
  });
});
