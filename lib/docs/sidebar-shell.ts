import { type LoadedRegistry, loadRegistry, mangacnItemName } from "@/lib/registry";

const SIDEBAR = "sidebar";

let shells: ReadonlySet<string> | null = null;

/** The sidebar and every item that installs it (`registryDependencies`), from the registry. */
export function sidebarShells(registry: LoadedRegistry = loadRegistry()): ReadonlySet<string> {
  return new Set(
    registry.items
      .filter(
        (item) =>
          item.name === SIDEBAR ||
          (item.registryDependencies ?? []).some((dep) => mangacnItemName(dep) === SIDEBAR),
      )
      .map((item) => item.name),
  );
}

/**
 * Whether an item's preview is an app shell: a sidebar that lays itself out by the window's
 * width (a sheet below 768 px), so a docs preview gives it a desktop-wide frame, scaled down,
 * rather than the docs column's width (MANGA-19).
 */
export function isSidebarShell(name: string): boolean {
  shells ??= sidebarShells();
  return shells.has(name);
}
