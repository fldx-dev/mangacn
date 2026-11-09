/**
 * Rules off in every axe run, the unit tests (lib/test/axe.ts, jsdom) and the stage pages
 * (e2e/demos.spec.ts, Chromium) alike. `color-contrast` needs real layout and paint in jsdom
 * (the theme's contrast is asserted in registry/theme/contrast.test.ts). `region` and
 * `page-has-heading-one` are page-level: a demo is a fragment with no landmarks or heading,
 * and its stage page is only ever shown in an iframe, where axe skips the heading rule (it
 * runs on the top window only); in jsdom neither reaches the `html` element anyway. No test
 * runner import, so Playwright can load it.
 */
export const AXE_DISABLED_RULES: string[] = ["color-contrast", "region", "page-has-heading-one"];
