import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import DrawerDefaultDemo from "./demos/default";
import DrawerDirectionsDemo from "./demos/directions";
import DrawerWithFormDemo from "./demos/with-form";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

type Direction = "up" | "right" | "down" | "left";

function Chapters({
  open,
  direction,
  handle,
}: {
  open?: boolean;
  direction?: Direction;
  handle?: boolean;
}) {
  return (
    <Drawer defaultOpen={open} swipeDirection={direction} showSwipeHandle={handle}>
      <DrawerTrigger>Chapters</DrawerTrigger>
      <DrawerContent className="custom-class">
        <DrawerHeader>
          <DrawerTitle>Volume 2</DrawerTitle>
          <DrawerDescription>Pick a chapter.</DrawerDescription>
        </DrawerHeader>
        <button type="button">Chapter 12</button>
      </DrawerContent>
    </Drawer>
  );
}

const frameOf = (element: Element | null) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Drawer", () => {
  it("opens from its trigger with stock roles, slots and aria wiring", async () => {
    render(<Chapters />);
    const trigger = screen.getByRole("button", { name: "Chapters" });
    expect(trigger.getAttribute("data-slot")).toBe("drawer-trigger");
    fireEvent.click(trigger);
    await act(async () => {});
    const popup = screen.getByRole("dialog");
    expect(popup.getAttribute("data-slot")).toBe("drawer-popup");
    expect(popup.getAttribute("data-swipe-axis")).toBe("y");
    expect(popup.classList.contains("custom-class")).toBe(true);
    expect(popup.getAttribute("aria-labelledby")).toBe(screen.getByText("Volume 2").id);
    expect(popup.getAttribute("aria-describedby")).toBe(screen.getByText("Pick a chapter.").id);
    for (const slot of ["drawer-viewport", "drawer-content", "drawer-overlay"]) {
      expect(document.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
  });

  it.each(["up", "right", "down", "left"] as const)(
    "draws one heavy hand-drawn open edge for swipeDirection=%s instead of a border",
    (direction) => {
      const ink = stubResizeObserver();
      render(<Chapters open direction={direction} />);
      const popup = screen.getByRole("dialog");
      for (const name of popup.classList) {
        expect(name, name).not.toMatch(/(^|:)border-[tblr]$|^shadow-/);
      }
      const frame = frameOf(popup);
      expect(frame?.getAttribute("data-edge")).toBe(direction);
      expect(frame?.getAttribute("data-fill")).toBe("none");
      expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
      ink.drawAll(320, 240);
      expect(frame?.dataset.inked).toBe("true");
      // One open stroke (no fill): the rule and its two corners, not a closed rectangle.
      const paths = [...(frame?.querySelectorAll("svg path") ?? [])];
      expect(paths.length).toBeGreaterThan(0);
      for (const path of paths) expect(path.getAttribute("fill") ?? "none").toBe("none");
    },
  );

  it("shows the swipe handle as a short ink stroke only when asked", () => {
    const { unmount } = render(<Chapters open />);
    expect(document.querySelector('[data-slot="drawer-swipe-handle"]')).toBeNull();
    unmount();
    render(<Chapters open handle />);
    const handle = document.querySelector('[data-slot="drawer-swipe-handle"]');
    expect(handle?.getAttribute("aria-hidden")).toBe("true");
    const stroke = frameOf(handle);
    expect(stroke?.getAttribute("data-shape")).toBe("line");
    expect(handle?.className).not.toContain("after:bg-muted");
  });

  it("inks the overlay (paper in dark mode)", () => {
    render(<Chapters open />);
    const overlay = document.querySelector('[data-slot="drawer-overlay"]');
    expect(overlay?.classList.contains("bg-ink/70")).toBe(true);
    expect(overlay?.classList.contains("dark:bg-paper/70")).toBe(true);
    expect(overlay?.classList.contains("bg-black/10")).toBe(false);
  });

  it("traps focus inside and closes on Escape, like stock", async () => {
    render(<Chapters open />);
    await act(async () => {});
    const popup = screen.getByRole("dialog");
    expect(popup.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await act(async () => {});
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has no axe violations in its default demo (open)", async () => {
    await expectNoA11yViolations(<DrawerDefaultDemo />, async () => {
      expect(await screen.findByRole("dialog")).toBeTruthy();
    });
  });

  it("has no axe violations in its directions demo (right open)", async () => {
    await expectNoA11yViolations(<DrawerDirectionsDemo />, async () => {
      const popup = await screen.findByRole("dialog");
      expect(popup.getAttribute("data-swipe-direction")).toBe("right");
    });
  });

  it("has no axe violations in its with-form demo (open)", async () => {
    await expectNoA11yViolations(<DrawerWithFormDemo />, async () => {
      expect(await screen.findByLabelText("Name")).toBeTruthy();
    });
  });
});
