import {
  type Cache,
  createFileSystemGeneratorCache,
  createGenerator,
  type GeneratedDoc,
  type Generator,
} from "fumadocs-typescript";

// Server-only: fumadocs-typescript runs the TypeScript compiler (a native process) and reads
// tsconfig.json from the working directory, the project root under `next build` and Vitest.

const INHERITED = "mangacnInherited";

/** `speech-bubble` → `SpeechBubbleProps`, the interface every manga-native item exports. */
export function propsInterfaceName(item: string): string {
  const pascal = item
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `${pascal}Props`;
}

/**
 * Creates a generator for manga-native props tables. Every props interface extends a DOM
 * attribute type, so each entry declared only under node_modules (the ~280 HTML, ARIA and
 * event props from @types/react) is marked and dropped; what is left is what the item
 * declares, including its cva variants and DOM props it redeclares (manga-frame's `alt`).
 */
export function createPropsGenerator(cache?: Cache): Generator {
  const generator = createGenerator({ cache: cache ?? false });
  return {
    ...generator,
    async generateTypeTable(props, options) {
      const docs = await generator.generateTypeTable(props, {
        ...options,
        transform(entry, _type, symbol) {
          const inherited = symbol.declarations.every((d) =>
            String(d.path).includes("/node_modules/"),
          );
          if (inherited) entry.tags.push({ name: INHERITED, text: "" });
        },
        typeSimplifier: {
          // Short types read better in full ("round" | "shout" …) than as Fumadocs' "union".
          override: ({ checker, type, location }) => {
            const full = checker
              .typeToString(type, location)
              .replace(/ \| (null|undefined)\b/g, "")
              .replace(/^(null|undefined) \| /, "");
            return full.length <= 60 ? full : undefined;
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

/** The build's generator, with results cached on disk across builds. */
export function getPropsGenerator(): Generator {
  shared ??= createPropsGenerator(createFileSystemGeneratorCache(".next/fumadocs-typescript"));
  return shared;
}

/**
 * The own props of an interface in an item's file (repo-relative), `<Pascal>Props` unless
 * `name` says otherwise, or `undefined` when it does not resolve (PropsTable then falls back
 * to a link to the source).
 */
export async function generateOwnProps(
  item: string,
  file: string,
  generator: Generator = getPropsGenerator(),
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
