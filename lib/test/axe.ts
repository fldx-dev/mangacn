import { act, cleanup, render } from "@testing-library/react";
import { type ComponentType, createElement, type ReactElement } from "react";
import { expect, it } from "vitest";
import { configureAxe } from "vitest-axe";
import { AXE_DISABLED_RULES } from "./axe-rules";
import { stubResizeObserver } from "./resize-observer";

/** axe-core for jsdom, with the shared rule set (./axe-rules.ts). */
export const axe = configureAxe({
  rules: Object.fromEntries(AXE_DISABLED_RULES.map((rule) => [rule, { enabled: false }])),
});

/**
 * Renders `ui` and fails with axe's report on any violation. Checks `document.body`, so
 * content that Base UI portals out of the render container is covered too. `ready` runs after
 * the render and before axe, for demos whose content arrives late (toasts fired on mount).
 */
export async function expectNoA11yViolations(
  ui: ReactElement,
  ready?: () => Promise<unknown>,
): Promise<void> {
  const { baseElement } = render(ui);
  try {
    await ready?.();
    expect(await axe(baseElement)).toHaveNoViolations();
  } finally {
    cleanup();
  }
}

/** What `import.meta.glob("./demos/*.tsx")` returns in an item test. */
export type DemoGlob = Record<string, () => Promise<{ default: ComponentType }>>;

export interface DemosAccessibleOptions {
  /** Runs before each demo renders, for stubs the item's demos need (layout, matchMedia). */
  setup?: () => void;
  /**
   * Per demo name, what to wait for after the render and before axe runs: content a demo
   * opens or fires on mount (a drawer, a toast) arrives after the first commit.
   */
  ready?: Record<string, () => Promise<unknown>>;
}

/** `./demos/in-a-panel.tsx` → `in-a-panel`. */
export function demoName(key: string): string {
  return key.replace(/^.*\//, "").replace(/\.tsx$/, "");
}

/**
 * Registers one `it.each` case per demo of an item. Call it inside the item's `describe` as
 * `expectDemosAccessible(import.meta.glob("./demos/*.tsx"))`: the glob is the same set the
 * demo map lists for the item (every `.tsx` directly in `demos/`), so a new demo is covered
 * without touching the test, and the test depends only on its own item's demos, so
 * `vitest --changed` stays per item (`lib/registry/demos.test.ts` asserts every item test
 * calls this). Each case runs `setup`, renders the demo with ResizeObserver stubbed, flushes
 * effects, waits for its `ready` step if any, draws every ink frame (so axe sees the drawn SVG, not the CSS fallback) and
 * fails on any violation.
 */
export function expectDemosAccessible(demos: DemoGlob, options: DemosAccessibleOptions = {}) {
  const loaders = new Map(Object.entries(demos).map(([key, load]) => [demoName(key), load]));
  if (loaders.size === 0)
    throw new Error('No demos matched; pass import.meta.glob("./demos/*.tsx").');
  const unknown = Object.keys(options.ready ?? {}).filter((demo) => !loaders.has(demo));
  if (unknown.length > 0) throw new Error(`ready names unknown demos: ${unknown.join(", ")}`);

  it.each([...loaders.keys()].sort())("has no axe violations in its %s demo", async (demo) => {
    const load = loaders.get(demo);
    if (!load) throw new Error(`No demo ${demo}`);
    const { default: Demo } = await load();
    const previous = Object.getOwnPropertyDescriptor(globalThis, "ResizeObserver");
    const ink = stubResizeObserver();
    try {
      options.setup?.();
      await expectNoA11yViolations(createElement(Demo), async () => {
        // Let effects settle: demos that open on mount position their popups after the commit.
        await act(async () => {});
        await options.ready?.[demo]?.();
        ink.drawAll();
      });
    } finally {
      // Put back only what this case stubbed: a file-level stub (matchMedia) must survive.
      if (previous) Object.defineProperty(globalThis, "ResizeObserver", previous);
      else Reflect.deleteProperty(globalThis, "ResizeObserver");
    }
  });
}
