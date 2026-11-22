import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { docVariant } from "@/lib/docs/variant-meta";
import { axe, expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { VariantFrame } from "./variant-frame";

// `cacheLife` only runs inside a Next.js "use cache" scope; Vitest ignores the directive.
vi.mock("next/cache", () => ({ cacheLife: () => {} }));

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("dark");
});

describe("VariantFrame", () => {
  it("renders an inline variant in the Preview tab, with a link to the variant alone", async () => {
    const meta = docVariant("speech-bubble", "tails");
    const { container } = render(await VariantFrame({ item: "speech-bubble", variant: "tails" }));
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveProperty("ariaSelected", "true");
    // Three shapes × seven tails, drawn in the page itself rather than an iframe.
    expect(container.querySelectorAll('[data-slot="speech-bubble"]')).toHaveLength(21);
    expect(container.querySelector("iframe")).toBeNull();
    const alone = screen.getByRole("link", { name: `Open in a new tab: ${meta?.label}` });
    expect(alone).toHaveProperty("pathname", `/view/${meta?.name}`);
    expect(alone.getAttribute("target")).toBe("_blank");
  });

  it("heads a component's variant with its anchored label, title and install chip", async () => {
    const meta = docVariant("speech-bubble", "tails");
    render(await VariantFrame({ item: "speech-bubble", variant: "tails" }));
    const heading = screen.getByRole("heading", { level: 3, name: meta?.label });
    expect(heading.id).toBe(meta?.name);
    expect(screen.getByText(meta?.title ?? "")).toBeTruthy();
    const chip = screen.getByRole("button", {
      name: `Copy the install command for @mangacn/${meta?.name}`,
    });
    expect(chip.textContent).toContain(`@mangacn/${meta?.name}`);
  });

  it("copies the install line for the package manager picked in the install tabs", async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    window.sessionStorage.setItem("package-manager", "bun");
    render(await VariantFrame({ item: "stamp", variant: "over-a-card" }));
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy the install command for @mangacn/c-stamp-3" }),
      );
    });
    expect(writeText).toHaveBeenCalledWith(
      "bunx --bun shadcn@latest add @mangacn/c-stamp-3 --overwrite",
    );
    window.sessionStorage.removeItem("package-manager");
  });

  it("gives a block's variant no header, and links it to its gallery stage", async () => {
    render(await VariantFrame({ item: "chapter-list", variant: "default" }));
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Open in a new tab: chapter-list / default" }),
    ).toHaveProperty("pathname", "/gallery/chapter-list/default");
  });

  it("shows the variant source with the install import in the Code tab", async () => {
    const { container } = render(await VariantFrame({ item: "speech-bubble", variant: "tails" }));
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Code" }));
    const code = container.querySelector("pre")?.textContent ?? "";
    expect(code).toContain('import { SpeechBubble } from "@/components/speech-bubble";');
    expect(code).not.toContain("@/registry/");
  });

  it("renders an overlay item as a titled iframe of its stage", async () => {
    render(await VariantFrame({ item: "dialog", variant: "default", height: "20rem" }));
    const frame = screen.getByTitle("dialog / default");
    expect(frame.tagName).toBe("IFRAME");
    expect(frame.getAttribute("src")).toBe("/gallery/dialog/default");
    expect(frame.style.height).toBe("20rem");
  });

  it("follows the site theme in the iframe", async () => {
    document.documentElement.classList.add("dark");
    render(await VariantFrame({ item: "sheet", variant: "default", title: "A sheet" }));
    const frame = screen.getByTitle("A sheet");
    expect(frame.getAttribute("src")).toBe("/gallery/sheet/default?mode=dark");

    await act(async () => {
      document.documentElement.classList.remove("dark");
      // MutationObserver callbacks run as microtasks.
      await Promise.resolve();
    });
    expect(frame.getAttribute("src")).toBe("/gallery/sheet/default");
  });

  it("gives the sidebar a desktop-wide stage, scaled to a docs column, and a phone's below", async () => {
    const observers = stubResizeObserver();
    const { container, baseElement } = render(
      await VariantFrame({ item: "sidebar", variant: "default", height: "20rem" }),
    );
    const box = container.querySelector<HTMLElement>('[data-slot="variant-stage-box"]');
    const frame = screen.getByTitle("sidebar / default");
    expect(frame.getAttribute("src")).toBe("/gallery/sidebar/default");
    expect(box?.style.height).toBe("20rem");
    const stage = frame.parentElement as HTMLElement;

    // A 1280 px window's docs column: the stage lays out at 768 px, the sidebar's breakpoint.
    observers.drawAll(646, 320);
    expect(box?.dataset.layoutWidth).toBe("768");
    expect(stage.style.width).toBe("768px");
    expect(stage.style.transform).toBe(`scale(${646 / 768})`);
    // A wider column: the stage fills it, unscaled.
    observers.drawAll(802, 320);
    expect(box?.dataset.layoutWidth).toBe("802");
    expect(stage.style.transform).toBe("");
    // A phone's column: the stage is the column, so the sidebar shows its phone layout.
    observers.drawAll(294, 320);
    expect(box?.dataset.layoutWidth).toBe("294");
    expect(stage.style.transform).toBe("");

    expect(await axe(baseElement, { iframes: false })).toHaveNoViolations();
  });

  it("throws on an unknown variant or item", async () => {
    await expect(VariantFrame({ item: "speech-bubble", variant: "nope" })).rejects.toThrow(
      /Unknown variant "nope" for item "speech-bubble"/,
    );
    await expect(VariantFrame({ item: "nope", variant: "default" })).rejects.toThrow(
      /Unknown item "nope"/,
    );
  });

  it("has no axe violations, inline and as an iframe", async () => {
    await expectNoA11yViolations(await VariantFrame({ item: "speech-bubble", variant: "tails" }));
    // axe cannot message into a jsdom iframe; the stage inside has its own axe checks.
    const { baseElement } = render(await VariantFrame({ item: "tooltip", variant: "default" }));
    expect(await axe(baseElement, { iframes: false })).toHaveNoViolations();
  });
});
