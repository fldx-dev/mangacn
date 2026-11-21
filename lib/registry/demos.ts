import { type DemoLoader, demoLoaders, pageLoaders } from "./demos.generated";

export type { Demo } from "./demo-list";
export { listDemos, listPages } from "./demo-list";
export type { DemoLoader, DemoModule } from "./demos.generated";

/** The lazy loader for one demo, or `undefined` when the item or demo does not exist. */
export function getDemoLoader(item: string, demo: string): DemoLoader | undefined {
  if (!Object.hasOwn(demoLoaders, item)) return undefined;
  const demos = demoLoaders[item];
  return Object.hasOwn(demos, demo) ? demos[demo] : undefined;
}

/** The lazy loader of a page block's page (its default export), or `undefined`. */
export function getPageLoader(block: string): DemoLoader | undefined {
  return Object.hasOwn(pageLoaders, block) ? pageLoaders[block] : undefined;
}
