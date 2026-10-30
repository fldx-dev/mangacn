import { type DemoLoader, demoEntries, demoLoaders } from "./demos.generated";

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
