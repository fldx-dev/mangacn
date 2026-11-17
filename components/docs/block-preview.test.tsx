import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { BlockPreview, layoutWidth, ScaledFrame, ScaledView } from "./block-preview";
import { PREVIEW_WIDTHS, SHELL_DESKTOP_MIN_BOX } from "./preview-widths";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const width = () =>
  document.querySelector('[data-slot="block-preview"]')?.getAttribute("data-width");

describe("BlockPreview", () => {
  it("frames /view/<item> with a phone, a tablet and a desktop width, desktop first", () => {
    render(<BlockPreview item="login-01" />);
    const frame = document.querySelector("iframe");
    expect(frame?.getAttribute("src")).toBe("/view/login-01");
    const group = screen.getByRole("group", { name: "Preview width" });
    const pressed = () =>
      [...group.querySelectorAll("button")].map((button) => button.getAttribute("aria-pressed"));
    expect(PREVIEW_WIDTHS.map((width) => width.label)).toEqual(["Phone", "Tablet", "Desktop"]);
    expect(pressed()).toEqual(["false", "false", "true"]);
    fireEvent.click(screen.getByRole("button", { name: "Phone" }));
    expect(pressed()).toEqual(["true", "false", "false"]);
    expect(document.querySelector('[data-slot="block-preview"]')?.getAttribute("data-width")).toBe(
      "phone",
    );
    expect(frame?.getAttribute("title")).toBe("login-01 page at phone width");
  });

  it("keeps the box at its height whatever the width", () => {
    render(<BlockPreview item="login-01" height="30rem" />);
    const box = document.querySelector<HTMLElement>('[data-slot="block-preview-box"]');
    expect(box?.style.height).toBe("30rem");
    fireEvent.click(screen.getByRole("button", { name: "Tablet" }));
    expect(box?.style.height).toBe("30rem");
  });

  it("opens at the phone's width in a column narrower than a tablet", () => {
    const observers = stubResizeObserver();
    render(<BlockPreview item="login-01" />);
    observers.drawAll(680, 576);
    expect(width()).toBe("phone");
  });

  it("keeps an app shell at the desktop width in a 1280 px window's docs column", async () => {
    const observers = stubResizeObserver();
    const { baseElement } = render(<BlockPreview item="sidebar-07" shell />);
    observers.drawAll(680, 576);
    expect(width()).toBe("desktop");
    const box = document.querySelector<HTMLElement>('[data-slot="block-preview-box"]');
    expect(box?.dataset.layoutWidth).toBe("1280");
    expect(screen.getByText(/Desktop, 1280 px, scaled to 53%/)).toBeTruthy();
    expect(await axe(baseElement, { iframes: false })).toHaveNoViolations();
  });

  it("opens an app shell at the phone's width in a phone's column", () => {
    const observers = stubResizeObserver();
    render(<BlockPreview item="sidebar-07" shell />);
    observers.drawAll(SHELL_DESKTOP_MIN_BOX - 1, 576);
    expect(width()).toBe("phone");
  });

  it("links to the page on its own", () => {
    render(<BlockPreview item="login-01" />);
    expect(screen.getByRole("link", { name: "Open the page: login-01" }).getAttribute("href")).toBe(
      "/view/login-01",
    );
  });
});

describe("ScaledView", () => {
  it("is inert as a whole when it is a preview", () => {
    const { container } = render(
      <ScaledView item="login-01" width={375} title="Login 01 page" inert className="h-full" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("inert")).toBe(true);
    expect(root.querySelector("iframe")?.hasAttribute("inert")).toBe(true);
  });
});

describe("layoutWidth", () => {
  it("is the given width, or the box's when filling a wider box or under nativeBelow", () => {
    expect(layoutWidth(500, { width: 768 })).toBe(768);
    expect(layoutWidth(900, { width: 768 })).toBe(768);
    expect(layoutWidth(900, { width: 768, fill: true })).toBe(900);
    expect(layoutWidth(600, { width: 768, fill: true, nativeBelow: 576 })).toBe(768);
    expect(layoutWidth(575, { width: 768, fill: true, nativeBelow: 576 })).toBe(575);
  });
});

describe("ScaledFrame", () => {
  it("centres a narrower screen with ruled edges unless it fills the box", () => {
    const observers = stubResizeObserver();
    const { container } = render(
      <>
        <ScaledFrame src="/demo/sidebar/default" width={768} title="Centred" />
        <ScaledFrame src="/demo/sidebar/default" width={768} title="Filled" fill />
      </>,
    );
    observers.drawAll(1000, 400);
    const [centred, filled] = [...container.children].map(
      (box) => box.firstElementChild as HTMLElement,
    );
    expect(centred.style.width).toBe("768px");
    expect(centred.className).toContain("outline");
    expect(filled.style.width).toBe("1000px");
    expect(filled.className).not.toContain("outline");
  });
});
