import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG, PENS } from "@/lib/create/config";
import { readUrlConfig, URL_WRITE_DELAY, useCreateConfig } from "./use-create-config";

beforeEach(() => {
  vi.useFakeTimers();
  window.history.replaceState(null, "", "/create");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("readUrlConfig", () => {
  it("reads ?c=, and no code at all is the default without a reason", () => {
    expect(readUrlConfig("")).toEqual({ config: DEFAULT_CONFIG, reason: null });
    expect(readUrlConfig("?c=111").config.look).toEqual({ preset: "sepia" });
    expect(readUrlConfig("?c=111").reason).toBeNull();
  });

  it("falls back to the default with the reason for a damaged code", () => {
    const { config, reason } = readUrlConfig("?c=1%3Cb%3E");
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(reason).toBe("the code has a character outside 0-9, A-Z, a-z");
  });
});

describe("useCreateConfig", () => {
  it("takes the state from the code in the URL", () => {
    window.history.replaceState(null, "", "/create?c=1312");
    const { result } = renderHook(() => useCreateConfig());
    expect(result.current.config.look).toEqual({ preset: "sepia" });
    expect(result.current.config.pen).toEqual(PENS.brush);
    expect(result.current.code).toBe("1312");
    expect(result.current.refused).toBeNull();
  });

  it("shows the default and the reason for a damaged code, until a choice is made", () => {
    window.history.replaceState(null, "", "/create?c=9zz");
    const push = vi.spyOn(window.history, "pushState");
    const { result } = renderHook(() => useCreateConfig());
    expect(result.current.config).toEqual(DEFAULT_CONFIG);
    expect(result.current.refused).toBe("code version 9 is not known");
    // The damaged code stays in the address until the visitor changes something.
    act(() => vi.advanceTimersByTime(URL_WRITE_DELAY * 2));
    expect(push).not.toHaveBeenCalled();
    act(() => result.current.dispatch({ type: "reset" }));
    expect(result.current.refused).toBeNull();
  });

  it("writes the canonical code once the changes stop: one history entry per burst", () => {
    const push = vi.spyOn(window.history, "pushState");
    const { result } = renderHook(() => useCreateConfig());
    act(() => {
      result.current.dispatch({ type: "pen-value", token: "outline-width", value: 1.6 });
    });
    act(() => vi.advanceTimersByTime(URL_WRITE_DELAY / 2));
    act(() => {
      result.current.dispatch({ type: "pen-value", token: "outline-width", value: 1.7 });
    });
    act(() => vi.advanceTimersByTime(URL_WRITE_DELAY / 2));
    act(() => {
      result.current.dispatch({ type: "look-preset", preset: "weekly" });
    });
    expect(push).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(URL_WRITE_DELAY));
    expect(push).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe(`?c=${result.current.code}`);
    expect(result.current.code.startsWith("13")).toBe(true);
  });

  it("restores an earlier code on Back", () => {
    const { result } = renderHook(() => useCreateConfig());
    act(() => result.current.dispatch({ type: "look-preset", preset: "sepia" }));
    act(() => vi.advanceTimersByTime(URL_WRITE_DELAY));
    act(() => result.current.dispatch({ type: "look-preset", preset: "blueline" }));
    act(() => vi.advanceTimersByTime(URL_WRITE_DELAY));
    expect(window.location.search).toBe("?c=113");
    // What the browser does on Back: the address changes, then popstate fires.
    const push = vi.spyOn(window.history, "pushState");
    act(() => {
      window.history.replaceState(null, "", "/create?c=111");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.config.look).toEqual({ preset: "sepia" });
    act(() => vi.advanceTimersByTime(URL_WRITE_DELAY * 2));
    expect(push).not.toHaveBeenCalled();
  });
});
