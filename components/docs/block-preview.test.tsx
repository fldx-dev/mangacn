import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BlockPreview, PREVIEW_WIDTHS, ScaledView } from "./block-preview";

afterEach(cleanup);

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
