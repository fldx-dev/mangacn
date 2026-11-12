import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { GeneratedDoc, Generator } from "fumadocs-typescript";
import { type LoadedRegistry, loadRegistry } from "@/lib/registry";
import { isPageBlock } from "@/lib/registry/blocks";
import { DOCS_SECTIONS } from "./catalog";
import { type GeneratedProps, propsInterfaceName } from "./props";

// Build time only: fumadocs-typescript runs the TypeScript compiler (a native process) and reads
// tsconfig.json from the working directory (the repo root under pnpm scripts and Vitest).
// `pnpm gen:props` writes what this generates to lib/docs/props.generated.json, which the pages,
// the `.md` routes and the MCP read through lib/docs/props.ts; no route runs this module.

export { propsInterfaceName };

const INHERITED = "mangacnInherited";

/**
 * Creates a generator for manga-native props tables. Every props interface extends a DOM
 * attribute type, so each entry declared only under node_modules (the ~280 HTML, ARIA and
 * event props from @types/react) is marked and dropped; what is left is what the item
 * declares, including its cva variants and DOM props it redeclares (manga-frame's `alt`).
 */
export function createPropsGenerator(): Generator {
  // fumadocs-typescript is ESM only and tsx runs the gen scripts as CommonJS (the package has no
  // "type": "module"), so it is loaded with import(), on the first table asked for.
  let loading: Promise<Generator> | undefined;
  const base = () => {
    loading ??= import("fumadocs-typescript").then(({ createGenerator }) =>
      createGenerator({ cache: false }),
    );
    return loading;
  };
  return {
    async generateDocumentation(file, name, options) {
      return (await base()).generateDocumentation(file, name, options);
    },
    async generateTypeTable(props, options) {
      const generator = await base();
      const docs = await generator.generateTypeTable(props, {
        ...options,
        transform(entry, _type, symbol) {
          const inherited = symbol.declarations.every((d) =>
            String(d.path).includes("/node_modules/"),
          );
          if (inherited) entry.tags.push({ name: INHERITED, text: "" });
        },
        typeSimplifier: {
          // Every type in full, however long, never Fumadocs' "union". A union behind one of the
          // item's own aliases (emanata's `Kind`) is spelled out, since readers cannot look the
          // alias up; library aliases (`React.ReactNode`) keep their name.
          override: ({ checker, type, location }) => {
            const print = (t: typeof type) => checker.typeToString(t, location);
            // An optional prop's `| undefined` and cva's `| null` say nothing a reader needs.
            const defined = type.getNonNullableType();
            const alias = type.getAliasSymbol() ?? defined.getAliasSymbol();
            const own = alias?.declarations.every(
              (d) => !String(d.path).includes("/node_modules/"),
            );
            if (own && defined.isUnionType()) return defined.getTypes().map(print).join(" | ");
            return print(alias ? type : defined);
          },
        },
      });
      return docs.map((doc) => ({
        ...doc,
        entries: doc.entries.filter((entry) => !entry.tags.some((tag) => tag.name === INHERITED)),
      }));
    },
  };
}

let shared: Generator | undefined;

/** One uncached generator per process, so a changed simplifier is never hidden by a cache. */
function sharedGenerator(): Generator {
  shared ??= createPropsGenerator();
  return shared;
}

/**
 * The own props of an interface in an item's file (repo-relative), `<Pascal>Props` unless
 * `name` says otherwise, or `undefined` when it does not resolve (PropsTable then falls back
 * to a line naming the source).
 */
export async function generateOwnProps(
  item: string,
  file: string,
  generator: Generator = sharedGenerator(),
  name: string = propsInterfaceName(item),
): Promise<GeneratedDoc[] | undefined> {
  try {
    const docs = await generator.generateTypeTable({ path: file, name });
    return docs.length > 0 ? docs : undefined;
  } catch (error) {
    console.warn(`PropsTable: ${name} did not resolve (${String(error)})`);
    return undefined;
  }
}

/** One props table to generate: an item, its source file and the interface name. */
export interface PropsTarget {
  item: string;
  file: string;
  name: string;
}

const PROPS_TABLE_TAG = /<PropsTable\s+item="([^"]+)"(?:\s+name="([^"]+)")?\s*\/>/g;

/**
 * Every manga-native table the docs print: `<Pascal>Props` of each `registry:component` and
 * `registry:block` item (a block's from its entry file), plus any other interface a page names
 * (`<PropsTable item="panel-grid" name="PanelGridItemProps" />`). Primitives (`registry:ui`) are
 * left out; their table is the static PROPS_DELTA.
 */
export function propsTargets(
  registry: LoadedRegistry = loadRegistry(),
  pagesDirs: readonly string[] = DOCS_SECTIONS.map((section) => path.resolve(section.dir)),
): PropsTarget[] {
  const targets = new Map<string, PropsTarget>();
  const add = (item: string, name: string) => {
    const entry = registry.items.find((candidate) => candidate.name === item);
    if (!entry || entry.type === "registry:ui") return;
    // The file that declares the interface (a page block's component), else the entry file.
    const declares = new RegExp(`\\b(?:interface|type)\\s+${name}\\b`);
    const file =
      entry.files.find((candidate) => {
        const absolute = path.resolve(candidate.path);
        return existsSync(absolute) && declares.test(readFileSync(absolute, "utf8"));
      })?.path ?? entry.files[0]?.path;
    if (file) targets.set(`${item}/${name}`, { item, file, name });
  };
  for (const entry of registry.items) {
    // A page block has no `<Pascal>Props`: its page takes none, its components name their own.
    if (isPageBlock(entry)) continue;
    if (entry.type === "registry:component" || entry.type === "registry:block") {
      add(entry.name, propsInterfaceName(entry.name));
    }
  }
  for (const pagesDir of pagesDirs.filter((dir) => existsSync(dir))) {
    for (const page of readdirSync(pagesDir).filter((file) => file.endsWith(".mdx"))) {
      const source = readFileSync(path.join(pagesDir, page), "utf8");
      for (const match of source.matchAll(PROPS_TABLE_TAG)) {
        add(match[1], match[2] ?? propsInterfaceName(match[1]));
      }
    }
  }
  return [...targets.values()].sort(
    (a, b) => a.item.localeCompare(b.item, "en") || a.name.localeCompare(b.name, "en"),
  );
}

/**
 * The text of lib/docs/props.generated.json: every target's tables, keys sorted, two-space
 * JSON with a final newline, so `gen:props --check` is a byte comparison. Throws naming every
 * interface that did not resolve, so a broken props interface fails the build, not the page.
 */
export async function renderPropsFile(
  targets: readonly PropsTarget[] = propsTargets(),
  generator: Generator = sharedGenerator(),
): Promise<string> {
  const props: GeneratedProps = {};
  const missing: string[] = [];
  for (const { item, file, name } of targets) {
    const docs = await generateOwnProps(item, file, generator, name);
    if (!docs) {
      missing.push(`${name} in ${file}`);
      continue;
    }
    props[item] ??= {};
    props[item][name] = docs.map(stableDoc);
  }
  if (missing.length > 0) throw new Error(`No props table for ${missing.join(", ")}`);
  return `${JSON.stringify(props, null, 2)}\n`;
}

/** A doc with its fields in one fixed order and no machine-specific values. */
function stableDoc(doc: GeneratedDoc): GeneratedDoc {
  return {
    id: doc.id,
    name: doc.name,
    ...(doc.description ? { description: doc.description } : {}),
    entries: doc.entries.map((entry) => ({
      name: entry.name,
      description: entry.description,
      type: entry.type,
      ...(entry.typeHref ? { typeHref: entry.typeHref } : {}),
      simplifiedType: entry.simplifiedType,
      tags: entry.tags.map((tag) => ({ name: tag.name, text: tag.text })),
      required: entry.required,
      deprecated: entry.deprecated,
    })),
  };
}
