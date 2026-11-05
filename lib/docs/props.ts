import { markdownTable } from "fumadocs-core/mdx-plugins/stringifier";
import type { DocEntry, GeneratedDoc } from "fumadocs-typescript";
import generated from "./props.generated.json";

// The manga-native props tables, read from lib/docs/props.generated.json (written by
// `pnpm gen:props` from lib/docs/typescript.ts at build time). Nothing here runs the TypeScript
// compiler, so the HTML pages, the `.md` routes and the MCP route (a Vercel function, where the
// compiler cannot start) all print the same tables. The JSON is a static import, so the bundler
// carries it into every route that renders a table; no file tracing is involved.

/** Repo-relative path of the generated file. */
export const PROPS_GENERATED_PATH = "lib/docs/props.generated.json";

/** item → props interface name → the tables `generateOwnProps` returned for it. */
export type GeneratedProps = Record<string, Record<string, GeneratedDoc[]>>;

const PROPS = generated as GeneratedProps;

/** `speech-bubble` → `SpeechBubbleProps`, the interface every manga-native item exports. */
export function propsInterfaceName(item: string): string {
  const pascal = item
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `${pascal}Props`;
}

/**
 * fumadocs-typescript's `typeTableToMarkdown`, copied: its package entry imports the compiler
 * (`typescript/sync`) at load, which the MCP's Vercel function cannot do, so the runtime path
 * imports neither. lib/docs/typescript.test.ts checks every generated table renders the same
 * through both, so an upgrade that changes the upstream form fails there.
 */
export function typeTableToMarkdown(doc: GeneratedDoc): string {
  let out = `### ${doc.name}\n\n`;
  if (doc.description) out += `${doc.description.trim()}\n\n`;
  const rows = [["Prop", "Type", "Description"]];
  for (const entry of doc.entries) rows.push(typeTableRow(entry));
  return out + markdownTable(rows);
}

function typeTableRow(entry: DocEntry): string[] {
  // The last default tag wins, as in fumadocs-typescript's parseTags.
  const fallback = [...entry.tags]
    .reverse()
    .find((tag) => tag.name === "default" || tag.name === "defaultValue")?.text;
  let description = entry.description.replace(/{@link ([^}]*)}/g, "$1").trim();
  if (fallback) description += `${description ? " " : ""}Default: \`${fallback}\``;
  if (entry.deprecated) description = `**Deprecated.** ${description}`;
  return [
    `\`${entry.name}${entry.required ? "" : "?"}\``,
    `\`${entry.simplifiedType}\``,
    description,
  ];
}

/** The generated tables of `name` (default `<Pascal>Props`) in `item`, or undefined. */
export function generatedProps(
  item: string,
  name: string = propsInterfaceName(item),
  props: GeneratedProps = PROPS,
): GeneratedDoc[] | undefined {
  const docs = props[item]?.[name];
  return docs && docs.length > 0 ? docs : undefined;
}
