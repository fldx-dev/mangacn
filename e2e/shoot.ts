import {
  expect,
  type Locator,
  type Page,
  type PageAssertionsToHaveScreenshotOptions,
} from "@playwright/test";

/**
 * Whether this run compares pixels. CI splits the suite in two: the `e2e` jobs set
 * `E2E_PIXELS=off` and check behaviour, keyboard and axe only; the `screenshots` jobs leave it
 * unset and compare every shot against its baseline. Pixels are compared only on Linux, where the
 * baselines are made.
 */
export const comparePixels = process.platform === "linux" && process.env.E2E_PIXELS !== "off";

/** `expect(target).toHaveScreenshot(name, options)`, or nothing when this run takes no pixels. */
export async function shoot(
  page: Page,
  name: string,
  options?: PageAssertionsToHaveScreenshotOptions,
): Promise<void>;
export async function shoot(
  locator: Locator,
  name: string,
  options?: Omit<PageAssertionsToHaveScreenshotOptions, "fullPage" | "clip">,
): Promise<void>;
export async function shoot(
  target: Page | Locator,
  name: string,
  options?: PageAssertionsToHaveScreenshotOptions,
): Promise<void> {
  if (!comparePixels) return;
  if ("mainFrame" in target) await expect(target).toHaveScreenshot(name, options);
  else await expect(target).toHaveScreenshot(name, options);
}
