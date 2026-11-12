import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { baseValues } from "@/lib/create/colours";
import { PRESET_BASE_TOKENS } from "@/lib/registry/theme-presets";
import { stubGetAnimations } from "@/lib/test/animations";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { InkFrame } from "@/registry/theme/ink-frame/ink-frame";
import { CreatePage } from "./create-page";

// next/font is a compiler transform; the test needs only the classes it hands out.
vi.mock("./create-fonts", () => ({ CREATE_FONT_CLASSES: "create-fonts" }));

const surface = () =>
  document.querySelector<HTMLElement>('[data-slot="create-preview-surface"]') as HTMLElement;
const rail = () => screen.getByRole("complementary", { name: "Choices" });

/** A slider's thumb input by the start of its label (thumbs stay hidden until measured). */
function slider(root: HTMLElement, name: string) {
  const input = within(root)
    .getAllByRole("slider", { hidden: true })
    .find((element) =>
      document
        .getElementById(element.getAttribute("aria-labelledby") ?? "")
        ?.textContent?.startsWith(name),
    );
  if (!input) throw new Error(`no slider labelled ${name}…`);
  return input;
}

function renderPage() {
  return render(
    <CreatePage>
      <InkFrame data-testid="specimen-frame">Specimen</InkFrame>
    </CreatePage>,
  );
}

// The rail's scroll areas call getAnimations() once a ResizeObserver exists.
let restoreAnimations: () => void;
beforeAll(() => {
  restoreAnimations = stubGetAnimations();
});
afterAll(() => restoreAnimations());

beforeEach(() => {
  window.history.replaceState(null, "", "/create");
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("CreatePage", () => {
  it("names every control in the rail by role", () => {
    renderPage();
    const choices = rail();
    const looks = within(choices).getByRole("group", { name: "Look" });
    for (const name of ["Default", "Sepia", "Weekly", "Blueline", "Custom"]) {
      expect(within(looks).getByRole("button", { name })).toBeTruthy();
    }
    for (const name of ["Fine", "Default", "Brush"]) {
      expect(
        within(within(choices).getByRole("group", { name: "Named pen" })).getByRole("button", {
          name,
        }),
      ).toBeTruthy();
    }
    for (const name of ["Outline width", "Heavy outline", "Roughness", "Dot pitch", "Dot size"]) {
      expect(slider(choices, name)).toBeTruthy();
    }
    expect(within(choices).getByRole("combobox", { name: /Display/ })).toBeTruthy();
    expect(within(choices).getByRole("combobox", { name: /Dialogue/ })).toBeTruthy();
    const kits = within(choices).getByRole("radiogroup", { name: "Starter kit" });
    expect(within(kits).getAllByRole("radio")).toHaveLength(5);
    expect(within(choices).getByRole("textbox", { name: "Code" })).toHaveProperty("value", "10");
    for (const name of ["Copy code", "Paste a code", "Shuffle", "Reset", "Get code"]) {
      expect(within(choices).getByRole("button", { name })).toBeTruthy();
    }
    expect(screen.getByRole("region", { name: "Preview of the chosen look" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Create" })).toBeTruthy();
  });

  it("puts a preset's base values and the derived tokens on the preview wrapper", () => {
    renderPage();
    fireEvent.click(within(rail()).getByRole("button", { name: "Sepia" }));
    const expected = baseValues({ preset: "sepia" }).light;
    for (const token of PRESET_BASE_TOKENS) {
      expect(surface().style.getPropertyValue(`--${token}`)).toBe(expected[token]);
    }
    expect(surface().style.getPropertyValue("--background")).toBe("var(--paper)");
    expect(surface().style.getPropertyValue("--outline-width")).toBe("1.5px");
  });

  it("puts a custom look's derived values on the wrapper, and the dark ones in dark mode", () => {
    window.history.replaceState(null, "", "/create?c=134FyJ8s12");
    renderPage();
    expect(screen.getByRole("group", { name: "Look" })).toBeTruthy();
    const look = { custom: { paper: { hue: 84, strength: 9 }, ink: { hue: 50, strength: 6 }, spot: { hue: 37, vividness: 6 } } };
    expect(surface().style.getPropertyValue("--paper")).toBe(baseValues(look).light.paper);
    expect(surface().style.getPropertyValue("--spot")).toBe(baseValues(look).light.spot);
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(surface().classList.contains("dark")).toBe(true);
    expect(surface().style.getPropertyValue("--paper")).toBe(baseValues(look).dark.paper);
    expect(surface().style.getPropertyValue("--spot")).toBe(baseValues(look).dark.spot);
  });

  it("follows the site's mode until the preview's own is chosen", async () => {
    document.documentElement.classList.add("dark");
    renderPage();
    expect(surface().dataset.mode).toBe("dark");
    expect(surface().style.getPropertyValue("--paper")).toBe(baseValues({ preset: "default" }).dark.paper);
    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(surface().dataset.mode).toBe("light");
  });

  it("redraws the preview's frames with a new pen without remounting them", async () => {
    const observers = stubResizeObserver();
    renderPage();
    observers.drawAll();
    const frame = screen.getByTestId("specimen-frame");
    const before = frame.querySelector("svg")?.innerHTML;
    fireEvent.click(within(rail()).getByRole("button", { name: "Brush" }));
    await waitFor(() => expect(frame.querySelector("svg")?.innerHTML).not.toBe(before));
    expect(screen.getByTestId("specimen-frame")).toBe(frame);
    const stroke = [...frame.querySelectorAll<SVGPathElement>("path")].find(
      (path) => path.style.stroke === "var(--ink)",
    );
    expect(stroke?.getAttribute("stroke-width")).toBe("2");
    expect(within(rail()).getByText("The brush pen.")).toBeTruthy();
  });

  it("calls a moved pen slider a custom pen", () => {
    renderPage();
    const thumb = slider(rail(), "Roughness");
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(within(rail()).getByText("A custom pen: your own settings.")).toBeTruthy();
    expect(surface().style.getPropertyValue("--ink-roughness")).toBe("1.3");
  });

  it("shows a refused code's reason in a note", () => {
    window.history.replaceState(null, "", "/create?c=1zzzz");
    renderPage();
    const note = document.querySelector('[data-slot="create-refused"]');
    expect(note?.textContent).toContain("could not be read");
    expect(within(rail()).getByRole("textbox", { name: "Code" })).toHaveProperty("value", "10");
  });

  it("opens a pasted code, and says why it refuses one", async () => {
    renderPage();
    fireEvent.click(within(rail()).getByRole("button", { name: "Paste a code" }));
    const dialog = await screen.findByRole("dialog", { name: "Paste a code" });
    const field = within(dialog).getByRole("textbox", { name: "Code or link" });
    fireEvent.change(field, { target: { value: "1~" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Open" }));
    expect((await within(dialog).findByRole("alert")).textContent).toContain(
      "the code has a character outside 0-9, A-Z, a-z",
    );
    fireEvent.change(field, { target: { value: "https://www.mangacn.com/create?c=112" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Open" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Paste a code" })).toBeNull());
    expect(within(rail()).getByRole("textbox", { name: "Code" })).toHaveProperty("value", "112");
  });

  it("announces a copied code politely", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    renderPage();
    const status = rail().querySelector('[data-slot="create-copy-status"]');
    expect(status?.getAttribute("aria-live")).toBe("polite");
    await act(async () => {
      fireEvent.click(within(rail()).getByRole("button", { name: "Copy code" }));
    });
    expect(writeText).toHaveBeenCalledWith("10");
    expect(status?.textContent).toBe("Code copied");
  });

  it("shuffles to a configuration whose code the field shows, and resets", () => {
    renderPage();
    fireEvent.click(within(rail()).getByRole("button", { name: "Shuffle" }));
    fireEvent.click(within(rail()).getByRole("button", { name: "Reset" }));
    expect(within(rail()).getByRole("textbox", { name: "Code" })).toHaveProperty("value", "10");
  });

  it("opens the choices in a drawer from the button at the bottom, and gives focus back", async () => {
    renderPage();
    const trigger = screen.getByRole("button", { name: /^Choices/ });
    trigger.focus();
    fireEvent.click(trigger);
    const drawer = await screen.findByRole("dialog", { name: "Choices" });
    expect(within(drawer).getByRole("button", { name: "Sepia" })).toBeTruthy();
    fireEvent.click(within(drawer).getByRole("button", { name: "Weekly" }));
    expect(within(drawer).getByRole("textbox", { name: "Code" })).toHaveProperty("value", "112");
    expect(surface().style.getPropertyValue("--paper")).toBe(baseValues({ preset: "weekly" }).light.paper);
    fireEvent.keyDown(drawer, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Choices" })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("explains Get code until the command ships", async () => {
    renderPage();
    fireEvent.click(within(rail()).getByRole("button", { name: "Get code" }));
    const dialog = await screen.findByRole("dialog", { name: "Get code" });
    expect(dialog.textContent).toContain("arrives with the next update");
    expect(within(dialog).getByRole("link", { name: "Installation" }).getAttribute("href")).toBe(
      "/docs/installation",
    );
  });

  it("has no axe violations", async () => {
    await expectNoA11yViolations(
      <CreatePage>
        <p>Specimen</p>
      </CreatePage>,
    );
  });
});
