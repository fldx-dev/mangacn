import { afterEach, describe, expect, it } from "vitest";
import { holdStageFocus, STAGE_FOCUS_SCRIPT } from "./stage-focus";

type FrameWindow = Window & typeof globalThis;

/** A same-origin frame, as a docs page embeds a stage: its `top` is the test's window. */
function embed(): FrameWindow {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const win = frame.contentWindow as FrameWindow | null;
  if (!win) throw new Error("the frame has no window");
  win.document.body.innerHTML = '<button id="a">A</button><button id="b">B</button>';
  return win;
}

function button(win: FrameWindow, id: string): HTMLButtonElement {
  const element = win.document.getElementById(id);
  if (!element) throw new Error(`no #${id}`);
  return element as HTMLButtonElement;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("holdStageFocus", () => {
  it("leaves a stage on its own page alone", () => {
    const focus = HTMLElement.prototype.focus;
    holdStageFocus(window);
    expect(HTMLElement.prototype.focus).toBe(focus);
    expect(document.documentElement.dataset.focusHeld).toBeUndefined();
  });

  it("holds script-driven focus in an embedded stage", () => {
    const win = embed();
    holdStageFocus(win);
    expect(win.document.documentElement.dataset.focusHeld).toBe("true");

    button(win, "a").focus();
    expect(win.document.activeElement).toBe(win.document.body);
    // The page that embeds the stage keeps its own focus.
    expect(document.activeElement?.tagName).not.toBe("IFRAME");
  });

  it("holds focus on SVG elements too", () => {
    const win = embed();
    const svg = win.document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("tabindex", "0");
    win.document.body.append(svg);
    holdStageFocus(win);
    svg.focus();
    expect(win.document.activeElement).toBe(win.document.body);
  });

  it.each(["pointerdown", "keydown", "focusin"])("gives focus back on %s", (type) => {
    const win = embed();
    const focus = win.HTMLElement.prototype.focus;
    holdStageFocus(win);
    expect(win.HTMLElement.prototype.focus).not.toBe(focus);

    button(win, "a").dispatchEvent(new win.Event(type, { bubbles: true }));
    expect(win.HTMLElement.prototype.focus).toBe(focus);
    expect(win.document.documentElement.dataset.focusHeld).toBeUndefined();

    button(win, "b").focus();
    expect(win.document.activeElement).toBe(button(win, "b"));
  });

  it("gives focus back before the stage's own handler runs", () => {
    // A focus guard hands a tabbed-in focus on to the popup from its own focus handler.
    const win = embed();
    holdStageFocus(win);
    button(win, "a").addEventListener("focusin", () => button(win, "b").focus());
    button(win, "a").dispatchEvent(new win.Event("focusin", { bubbles: true }));
    expect(win.document.activeElement).toBe(button(win, "b"));
  });

  it("hands a tabbed-in focus to the element the stage last asked to focus", async () => {
    const win = embed();
    holdStageFocus(win);
    // The open dialog asked for its field while focus was held; the reader then tabs in and
    // lands on the first tabbable, the trigger.
    button(win, "a").focus();
    button(win, "b").focus();
    button(win, "a").dispatchEvent(new win.Event("focusin", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(win.document.activeElement).toBe(button(win, "b"));
  });

  it("leaves the focus to a press", async () => {
    const win = embed();
    holdStageFocus(win);
    button(win, "b").focus();
    button(win, "a").dispatchEvent(new win.Event("pointerdown", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(win.document.activeElement).toBe(win.document.body);
  });

  it("skips an element that left the page before the reader came", async () => {
    const win = embed();
    holdStageFocus(win);
    const gone = button(win, "b");
    gone.focus();
    gone.remove();
    button(win, "a").dispatchEvent(new win.Event("focusin", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(win.document.activeElement).toBe(win.document.body);
  });

  it("releases once and stops listening", () => {
    const win = embed();
    const focus = win.HTMLElement.prototype.focus;
    holdStageFocus(win);
    win.dispatchEvent(new win.Event("pointerdown"));
    // A later patch by someone else is not undone by a second event.
    const other = () => {};
    win.HTMLElement.prototype.focus = other;
    win.dispatchEvent(new win.Event("keydown"));
    expect(win.HTMLElement.prototype.focus).toBe(other);
    win.HTMLElement.prototype.focus = focus;
  });
});

describe("STAGE_FOCUS_SCRIPT", () => {
  it("is the function's own source, called with the window", () => {
    expect(STAGE_FOCUS_SCRIPT.startsWith("(")).toBe(true);
    expect(STAGE_FOCUS_SCRIPT.endsWith(")(window)")).toBe(true);
    // It runs as written in the stage document: no module-scope name may leak into it.
    const run = new Function("window", STAGE_FOCUS_SCRIPT);
    const win = embed();
    run(win);
    expect(win.document.documentElement.dataset.focusHeld).toBe("true");
    button(win, "a").focus();
    expect(win.document.activeElement).toBe(win.document.body);
  });
});
