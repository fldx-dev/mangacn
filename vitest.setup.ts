import { expect } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

expect.extend(axeMatchers);

// vitest-axe 0.1.0 types its matcher on the legacy `Vi` namespace; Vitest 5 reads `Matchers`,
// whose type parameters an augmentation must repeat exactly.
declare module "vitest" {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> {
    /** Fails with axe's report when the results contain violations (vitest-axe). */
    toHaveNoViolations(): R;
  }
}
