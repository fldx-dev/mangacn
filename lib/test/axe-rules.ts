/**
 * Rules off in every axe run, the unit tests (lib/test/axe.ts, jsdom) and the stage pages
 * (e2e/demos.spec.ts, Chromium) alike. `color-contrast` cannot run in jsdom, which neither lays
 * out nor paints (the theme's contrast is asserted in registry/theme/contrast.test.ts); the
 * stage pages run it on its own, in both modes, against `CONTRAST_EXEMPTIONS` below. `region`
 * and `page-has-heading-one` are page-level: a demo is a fragment with no landmarks or heading,
 * and its stage page is only ever shown in an iframe, where axe skips the heading rule (it runs
 * on the top window only); in jsdom neither reaches the `html` element anyway. No test runner
 * import, so Playwright can load it.
 */
export const AXE_DISABLED_RULES: string[] = ["color-contrast", "region", "page-has-heading-one"];

/**
 * Why text on a stage may stay below WCAG's contrast minimum. Nothing else is a reason; "it
 * looks better" is not one.
 */
export type ContrastExemptionReason =
  /** WCAG 1.4.3 exempts the text of an inactive control. */
  | "disabled control"
  /** Decorative lettering (an SFX burst) whose words are also in its accessible text. */
  | "decorative, repeated in accessible text"
  /** The stage's only failure is inside a frame it does not own. */
  | "third-party frame";

export interface ContrastExemption {
  item: string;
  demo: string;
  /** A CSS selector on the stage page; matching nodes leave the contrast check only. */
  selector: string;
  reason: ContrastExemptionReason;
  /** One line naming the text and its colours, copied into SPEC-components-4 §8.2. */
  note: string;
}

/**
 * Text the stage-page contrast check skips, by name (SPEC-components-4 §8.2). Every other node
 * on every stage is checked in light and dark. Empty since Task 83: its listing run found no
 * failure, so nothing was fixed or exempted. Keep it short; each entry is copied into the spec,
 * and lib/test/axe-rules.test.ts fails on an entry that names no demo.
 */
export const CONTRAST_EXEMPTIONS: readonly ContrastExemption[] = [];
