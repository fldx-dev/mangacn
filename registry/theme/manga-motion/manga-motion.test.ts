import { cleanup, render } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import MangaMotionDefaultDemo from "./demos/default";
import * as mangaMotion from "./manga-motion";

afterEach(cleanup);

const { springs, easings, ...variants } = mangaMotion;
const springValues = Object.values(springs) as unknown[];
const easingValues = Object.values(easings) as unknown[];

describe("manga-motion", () => {
  it("exports only plain, JSON-serialisable objects", () => {
    for (const [name, value] of Object.entries(mangaMotion)) {
      expect(typeof value, name).toBe("object");
      expect(JSON.parse(JSON.stringify(value)), name).toEqual(value);
    }
  });

  it("exports the documented variants", () => {
    expect(Object.keys(variants).sort()).toEqual(["flash", "popIn", "shake", "slamIn"]);
  });

  it("uses only the shared springs and easings in variant transitions", () => {
    for (const [name, variant] of Object.entries(variants)) {
      for (const [label, target] of Object.entries(variant)) {
        const { transition } = target as { transition?: { type?: string; ease?: unknown } };
        if (!transition) continue;
        const where = `${name}.${label}`;
        if (transition.type === "spring") {
          expect(springValues, where).toContain(transition);
        } else {
          expect(easingValues, where).toContain(transition.ease);
        }
      }
    }
  });

  it("gives every spring a type, stiffness and damping", () => {
    for (const spring of Object.values(springs)) {
      expect(spring.type).toBe("spring");
      expect(spring.stiffness).toBeGreaterThan(0);
      expect(spring.damping).toBeGreaterThan(0);
    }
  });

  it("renders the default demo", () => {
    const { getByText } = render(createElement(MangaMotionDefaultDemo));
    expect(getByText("Dokan!")).toBeDefined();
  });
});
