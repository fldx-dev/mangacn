import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import SonnerDefaultDemo from "./demos/default";
import SonnerKindsDemo from "./demos/kinds";
import SonnerWithActionDemo from "./demos/with-action";
import { Toaster } from "./sonner";

// jsdom has no matchMedia; sonner reads it for `theme="system"` (no next-themes provider here).
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
      }) as unknown as MediaQueryList,
  );
});

afterEach(() => {
  // sonner keeps its toasts in a module-level store; clear it between tests.
  act(() => {
    toast.dismiss();
  });
  cleanup();
  vi.unstubAllGlobals();
});

const toastsOnPage = () => [...document.querySelectorAll<HTMLElement>("[data-sonner-toast]")];
const frameOf = (element: Element | null | undefined) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

/** Waits until `count` toasts are on the page, each with its own ink frame. */
async function framedToasts(count: number) {
  await waitFor(() => {
    const toasts = toastsOnPage();
    expect(toasts).toHaveLength(count);
    for (const element of toasts) expect(frameOf(element)).not.toBeNull();
  });
  return toastsOnPage();
}

describe("Sonner", () => {
  it("keeps the stock Toaster: a polite live region and a toast per toast() call", async () => {
    render(<Toaster />);
    act(() => {
      toast("Chapter 12 saved", { description: "Reading resumes on page 3." });
    });
    const [element] = await framedToasts(1);
    expect(screen.getByText("Chapter 12 saved")).toBeTruthy();
    expect(screen.getByText("Reading resumes on page 3.")).toBeTruthy();
    const region = document.querySelector("section[aria-live]");
    expect(region?.getAttribute("aria-live")).toBe("polite");
    expect(element.closest("[data-sonner-toaster]")?.classList.contains("toaster")).toBe(true);
    expect(element.classList.contains("cn-toast")).toBe(true);
  });

  it("frames every toast with the heavy paper outline and no shadow or border", async () => {
    const ink = stubResizeObserver();
    render(<Toaster />);
    act(() => {
      toast("One");
      toast("Two");
    });
    const toasts = await framedToasts(2);
    ink.drawAll(356, 64);
    for (const element of toasts) {
      const frame = frameOf(element);
      expect(frame?.getAttribute("data-fill")).toBe("paper");
      expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
      expect(frame?.className).toContain("opacity-100!");
      expect(frame?.dataset.inked).toBe("true");
      expect(element.className).toContain("shadow-none!");
      expect(element.className).toContain("has-[>[data-inked=true]]:bg-transparent!");
    }
    const toaster = toasts[0].closest<HTMLElement>("[data-sonner-toaster]");
    expect(toaster?.style.getPropertyValue("--normal-border")).toBe("transparent");
    expect(toaster?.style.getPropertyValue("--normal-bg")).toBe("var(--popover)");
  });

  it("drops a toast's frame with the toast", async () => {
    render(<Toaster />);
    let id: string | number = "";
    act(() => {
      id = toast("Gone soon");
    });
    await framedToasts(1);
    act(() => {
      toast.dismiss(id);
    });
    await waitFor(() => expect(toastsOnPage()).toHaveLength(0), { timeout: 2000 });
    expect(document.querySelector('[data-slot="ink-frame"]')).toBeNull();
  });

  it.each(["success", "info", "warning", "error"] as const)(
    "draws the %s icon as an ink glyph in currentColor",
    async (kind) => {
      render(<Toaster />);
      act(() => {
        toast[kind]("Kind");
      });
      const [element] = await framedToasts(1);
      const glyph = element.querySelector("[data-icon] svg");
      expect(glyph?.getAttribute("data-glyph")).toBe(kind);
      expect(glyph?.getAttribute("stroke")).toBe("currentColor");
      expect(glyph?.getAttribute("aria-hidden")).toBe("true");
    },
  );

  it("with richColors inks only errors in spot", async () => {
    render(<Toaster richColors />);
    act(() => {
      toast.error("Page 7 failed");
      toast.success("Saved");
    });
    const toasts = await framedToasts(2);
    const error = toasts.find((element) => element.dataset.type === "error");
    expect(error?.dataset.richColors).toBe("true");
    expect(frameOf(error)?.className).toContain(
      "group-data-[rich-colors=true]/toast:group-data-[type=error]/toast:[--ink:var(--destructive)]",
    );
    const toaster = toasts[0].closest<HTMLElement>("[data-sonner-toaster]");
    expect(toaster?.style.getPropertyValue("--error-text")).toBe("var(--destructive)");
    for (const kind of ["success", "info", "warning"]) {
      expect(toaster?.style.getPropertyValue(`--${kind}-text`), kind).toBe(
        "var(--popover-foreground)",
      );
      expect(toaster?.style.getPropertyValue(`--${kind}-bg`), kind).toBe("var(--popover)");
    }
  });

  it("passes stock props through to sonner", async () => {
    render(<Toaster position="top-center" closeButton />);
    act(() => {
      toast("Positioned");
    });
    const [element] = await framedToasts(1);
    expect(element.dataset.yPosition).toBe("top");
    expect(element.dataset.xPosition).toBe("center");
    const close = screen.getByRole("button", { name: "Close toast" });
    expect(frameOf(close)?.getAttribute("data-shape")).toBe("ellipse");
  });

  it("has no axe violations in its default demo (toast visible)", async () => {
    await expectNoA11yViolations(<SonnerDefaultDemo />, () => framedToasts(1));
  });

  it("has no axe violations in its kinds demo (four toasts visible)", async () => {
    await expectNoA11yViolations(<SonnerKindsDemo />, () => framedToasts(4));
  });

  it("has no axe violations in its with-action demo (toast visible)", async () => {
    await expectNoA11yViolations(<SonnerWithActionDemo />, async () => {
      await framedToasts(1);
      expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
    });
  });
});
