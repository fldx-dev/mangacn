import { describe, expect, it } from "vitest";
import { loadRegistry, mangacnItemName } from "@/lib/registry";
import { installTarget } from "@/lib/registry/install-target";
import { KIT_CATALOG_V1, KIT_NAMES, KITS, kitItems } from "./kits";

const registry = loadRegistry();
const byName = new Map(registry.items.map((item) => [item.name, item]));

/** An item and every mangacn item it depends on, transitively. */
function closure(names: readonly string[]): string[] {
  const seen = new Set<string>();
  const visit = (name: string) => {
    if (seen.has(name)) return;
    seen.add(name);
    for (const dependency of byName.get(name)?.registryDependencies ?? []) {
      const depName = mangacnItemName(dependency);
      if (depName) visit(depName);
    }
  };
  names.forEach(visit);
  return [...seen];
}

describe("starter kits", () => {
  it("names five kits, each with at least one item", () => {
    expect(Object.keys(KITS)).toEqual([...KIT_NAMES]);
    for (const name of KIT_NAMES) expect(KITS[name].length).toBeGreaterThan(0);
  });

  it.each(KIT_NAMES)("%s names only catalog items, none of them a theme or a font", (name) => {
    for (const item of KITS[name]) {
      expect(byName.has(item), item).toBe(true);
      expect(["registry:theme", "registry:font"]).not.toContain(byName.get(item)?.type);
    }
  });

  it.each(KIT_NAMES)(
    "%s with the theme and every dependency writes no path from two items",
    (name) => {
      const owners = new Map<string, string>();
      const clashes: string[] = [];
      for (const itemName of closure(["theme", ...KITS[name]])) {
        for (const file of byName.get(itemName)?.files ?? []) {
          const target = installTarget(file);
          const owner = owners.get(target);
          if (owner && owner !== itemName) clashes.push(`${target}: ${owner} and ${itemName}`);
          owners.set(target, itemName);
        }
      }
      expect(clashes).toEqual([]);
    },
  );

  it("basics is the Installation page's set (theme from the look) plus a button", () => {
    expect(KITS.basics).toEqual(["ink-frame", "speech-bubble", "button"]);
  });

  it("returns a kit's items by name", () => {
    expect(kitItems({ preset: "chat" })).toEqual(["chat-thread"]);
    expect(kitItems({ custom: ["card", "badge"] })).toEqual(["card", "badge"]);
  });
});

describe("the custom kit catalog of code version 1", () => {
  it("is sorted, without duplicates", () => {
    expect([...KIT_CATALOG_V1]).toEqual([...new Set(KIT_CATALOG_V1)].sort());
  });

  it("still names only catalog items that are not themes or fonts", () => {
    for (const name of KIT_CATALOG_V1) {
      expect(byName.has(name), name).toBe(true);
      expect(["registry:theme", "registry:font"]).not.toContain(byName.get(name)?.type);
    }
  });

  it("holds 100 names, which the set form's 17 characters fit", () => {
    expect(KIT_CATALOG_V1).toHaveLength(100);
    expect(62 ** 17).toBeGreaterThan(2 ** 100);
  });
});
