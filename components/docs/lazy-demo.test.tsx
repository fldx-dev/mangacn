import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LazyDemo } from "./lazy-demo";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

/** A fake IntersectionObserver that records its options and lets the test fire it. */
function stubObserver() {
  const observers: {
    callback: Callback;
    options?: IntersectionObserverInit;
    disconnect: () => void;
  }[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      disconnect = vi.fn();
      observe = vi.fn();
      constructor(callback: Callback, options?: IntersectionObserverInit) {
        observers.push({ callback, options, disconnect: this.disconnect });
      }
    },
  );
  return observers;
}

function stubReducedData(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matches && query === "(prefers-reduced-data: reduce)",
  }));
}

const demo = <p>live demo</p>;

describe("LazyDemo", () => {
  it("shows a placeholder of the demo's height until the box nears the screen", () => {
    const observers = stubObserver();
    stubReducedData(false);
    const { container } = render(<LazyDemo height="20rem">{demo}</LazyDemo>);
    const box = container.querySelector<HTMLElement>('[data-slot="lazy-demo"]');
    expect(box?.dataset.mounted).toBe("false");
    expect(box?.style.height).toBe("20rem");
    expect(screen.queryByText("live demo")).toBeNull();
    expect(observers).toHaveLength(1);
    expect(observers[0].options).toEqual({ rootMargin: "100% 0px" });

    act(() => observers[0].callback([{ isIntersecting: false }]));
    expect(screen.queryByText("live demo")).toBeNull();

    act(() => observers[0].callback([{ isIntersecting: true }]));
    expect(screen.getByText("live demo")).toBeTruthy();
    expect(box?.dataset.mounted).toBe("true");
    expect(box?.style.height).toBe("20rem");
    expect(observers[0].disconnect).toHaveBeenCalled();
  });

  it("mounts at once without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<LazyDemo height="20rem">{demo}</LazyDemo>);
    expect(screen.getByText("live demo")).toBeTruthy();
  });

  it("mounts at once under prefers-reduced-data", () => {
    const observers = stubObserver();
    stubReducedData(true);
    render(<LazyDemo height="20rem">{demo}</LazyDemo>);
    expect(screen.getByText("live demo")).toBeTruthy();
    expect(observers).toHaveLength(0);
  });

  it("stops observing when it unmounts first", () => {
    const observers = stubObserver();
    stubReducedData(false);
    const { unmount } = render(<LazyDemo height="20rem">{demo}</LazyDemo>);
    unmount();
    expect(observers[0].disconnect).toHaveBeenCalled();
  });
});
