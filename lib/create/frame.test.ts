import { afterEach, describe, expect, it, vi } from "vitest";
import { INK_REDRAW_EVENT } from "@/registry/theme/ink-frame/ink-frame";
import { encode, MAX_CODE_LENGTH } from "./code";
import { baseValues } from "./colours";
import { type CreateConfig, DEFAULT_CONFIG, PENS } from "./config";
import {
  applyCode,
  CODE_MESSAGE,
  codeFromMessage,
  followCode,
  READY_MESSAGE,
  REDRAW_EVENT,
} from "./frame";

// next/font is a compiler transform; the module needs only the classes it hands out.
vi.mock("@/components/create/create-fonts", () => ({
  CREATE_FONT_CLASSES: "font-a font-b",
}));

const CUSTOM: CreateConfig = {
  ...DEFAULT_CONFIG,
  look: {
    custom: {
      paper: { hue: 200, strength: 6 },
      ink: { hue: 280, strength: 8 },
      spot: { hue: 150, vividness: 7 },
    },
  },
  pen: { ...PENS.brush },
  fonts: { display: "reggae-one", dialogue: "patrick-hand-sc" },
};

const root = () => document.documentElement;
const variable = (name: string) => root().style.getPropertyValue(name);

afterEach(() => {
  root().removeAttribute("style");
  root().className = "";
  vi.restoreAllMocks();
});

describe("REDRAW_EVENT", () => {
  it("is the event InkFrame redraws on", () => {
    expect(REDRAW_EVENT).toBe(INK_REDRAW_EVENT);
  });
});

describe("codeFromMessage", () => {
  it("takes the code of our message and nothing else", () => {
    expect(codeFromMessage({ type: CODE_MESSAGE, code: "111" })).toBe("111");
    expect(codeFromMessage({ type: READY_MESSAGE })).toBeNull();
    expect(codeFromMessage({ type: CODE_MESSAGE, code: 111 })).toBeNull();
    expect(codeFromMessage({ type: "other", code: "111" })).toBeNull();
    expect(codeFromMessage("111")).toBeNull();
    expect(codeFromMessage(null)).toBeNull();
    expect(
      codeFromMessage({ type: CODE_MESSAGE, code: "1".repeat(MAX_CODE_LENGTH + 1) }),
    ).toBeNull();
  });
});

describe("applyCode", () => {
  it("sets a code's base values in the root's mode, and replaces them with the next code's", () => {
    const set = applyCode(root(), encode(CUSTOM));
    expect(variable("--paper")).toBe(baseValues(CUSTOM.look).light.paper);
    expect(variable("--spot")).toBe(baseValues(CUSTOM.look).light.spot);
    expect(variable("--font-display")).toBe("var(--font-create-reggae-one)");
    root().classList.add("dark");
    const again = applyCode(root(), "111", set);
    expect(variable("--paper")).toBe(baseValues({ preset: "sepia" }).dark.paper);
    // The default faces set no font variable: the previous code's is gone.
    expect(variable("--font-display")).toBe("");
    expect(again).not.toContain("--font-display");
  });

  it("leaves the default look for a bad code, clearing what was set", () => {
    const set = applyCode(root(), encode(CUSTOM));
    for (const bad of ["", "1zz", "<script>", "9", "1".repeat(200)]) {
      expect(applyCode(root(), bad, set)).toEqual([]);
      expect(root().getAttribute("style") ?? "").toBe("");
    }
  });
});

describe("followCode", () => {
  it("applies the code with the font classes, marks the root ready, and restores it on abort", () => {
    const done = new AbortController();
    followCode(window, encode(CUSTOM), done.signal);
    expect(root().classList.contains("font-a")).toBe(true);
    expect(root().dataset.variantReady).toBe("true");
    expect(variable("--paper")).toBe(baseValues(CUSTOM.look).light.paper);
    done.abort();
    expect(root().classList.contains("font-a")).toBe(false);
    expect(root().getAttribute("style") ?? "").toBe("");
    delete root().dataset.variantReady;
  });

  it("does nothing once the page has gone", () => {
    const done = new AbortController();
    done.abort();
    followCode(window, encode(CUSTOM), done.signal);
    expect(root().getAttribute("style") ?? "").toBe("");
    expect(root().dataset.variantReady).toBeUndefined();
  });

  it("in a frame, says it listens and follows the parent's codes only", () => {
    const parent = { postMessage: vi.fn() } as unknown as Window;
    vi.spyOn(window, "parent", "get").mockReturnValue(parent);
    const redraws = vi.fn();
    document.addEventListener(INK_REDRAW_EVENT, redraws);
    const done = new AbortController();
    followCode(window, "10", done.signal);
    expect(parent.postMessage).toHaveBeenCalledWith(
      { type: READY_MESSAGE },
      window.location.origin,
    );

    const send = (data: unknown, init: MessageEventInit = {}) =>
      window.dispatchEvent(
        new MessageEvent("message", {
          data,
          origin: window.location.origin,
          source: parent as MessageEventSource,
          ...init,
        }),
      );
    // Another origin, or another window, changes nothing.
    send({ type: CODE_MESSAGE, code: "111" }, { origin: "https://example.com" });
    send({ type: CODE_MESSAGE, code: "111" }, { source: window });
    expect(variable("--paper")).toBe(baseValues({ preset: "default" }).light.paper);
    send({ type: CODE_MESSAGE, code: "111" });
    expect(variable("--paper")).toBe(baseValues({ preset: "sepia" }).light.paper);
    expect(redraws).toHaveBeenCalledTimes(1);

    done.abort();
    send({ type: CODE_MESSAGE, code: "112" });
    expect(variable("--paper")).toBe("");
    document.removeEventListener(INK_REDRAW_EVENT, redraws);
    delete root().dataset.variantReady;
  });
});
