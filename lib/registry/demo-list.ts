import { demoEntries, pageEntries } from "./demo-list.generated";

// The demos and page blocks as data only. The `/view` and `/demo` routes read this module, not
// lib/registry/demos.ts: that one's loaders `import()` every demo, and Turbopack gives a route the
// client code of every module its server code can reach that way (MANGA-21).

export interface Demo {
  item: string;
  demo: string;
  path: string;
}

/** Every demo, sorted by item then demo name. */
export function listDemos(): readonly Demo[] {
  return demoEntries;
}

/** Every page block's route file (`registry/blocks/login-01/page.tsx`), sorted by block. */
export function listPages(): readonly { block: string; path: string }[] {
  return pageEntries;
}
