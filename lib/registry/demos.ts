import {
  type DemoLoader,
  demoEntries,
  demoLoaders,
  pageEntries,
  pageLoaders,
} from "./demos.generated";

export type { DemoLoader, DemoModule } from "./demos.generated";

export interface Demo {
  item: string;
  demo: string;
  path: string;
}

/** Every demo, sorted by item then demo name. */
export function listDemos(): readonly Demo[] {
  return demoEntries;
}

/** The lazy loader for one demo, or `undefined` when the item or demo does not exist. */
export function getDemoLoader(item: string, demo: string): DemoLoader | undefined {
  if (!Object.hasOwn(demoLoaders, item)) return undefined;
  const demos = demoLoaders[item];
  return Object.hasOwn(demos, demo) ? demos[demo] : undefined;
}

/** Every page block's route file (`registry/blocks/login-01/page.tsx`), sorted by block. */
export function listPages(): readonly { block: string; path: string }[] {
  return pageEntries;
}

/** The lazy loader of a page block's page (its default export), or `undefined`. */
export function getPageLoader(block: string): DemoLoader | undefined {
  return Object.hasOwn(pageLoaders, block) ? pageLoaders[block] : undefined;
}
