import { cleanup, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { expect } from "vitest";
import { configureAxe } from "vitest-axe";

/**
 * axe-core configured for jsdom: `color-contrast` needs real layout and paint (the theme's
 * contrast is asserted in registry/theme/contrast.test.ts), and `region` expects a full page
 * with landmarks, which a single component demo never has.
 */
export const axe = configureAxe({
  rules: {
    "color-contrast": { enabled: false },
    region: { enabled: false },
  },
});

/**
 * Renders `ui` and fails with axe's report on any violation. Checks `document.body`, so
 * content that Base UI portals out of the render container is covered too.
 */
export async function expectNoA11yViolations(ui: ReactElement): Promise<void> {
  const { baseElement } = render(ui);
  try {
    expect(await axe(baseElement)).toHaveNoViolations();
  } finally {
    cleanup();
  }
}
