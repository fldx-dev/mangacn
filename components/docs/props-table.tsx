import type { GeneratedDoc, Generator } from "fumadocs-typescript";
import { AutoTypeTable } from "fumadocs-typescript/ui";
import { type TypeNode, TypeTable } from "fumadocs-ui/components/type-table";
import { cacheLife } from "next/cache";
import type { ReactNode } from "react";
import { PROPS_DELTA, type PropDelta, shadcnDocsUrl } from "@/lib/docs/props-delta";
import { generateOwnProps, propsInterfaceName } from "@/lib/docs/typescript";
import { loadRegistry } from "@/lib/registry";

const SOURCE_URL = "https://github.com/fldx-dev/mangacn/blob/main";

const linkClass = "font-medium underline underline-offset-4 hover:text-fd-primary";

export interface PropsTableProps {
  item: string;
  /**
   * Another props interface exported by a manga-native item's file (panel-grid's
   * `PanelGridItemProps`). Defaults to `<Pascal>Props`; primitives ignore it.
   */
  name?: string;
}

/**
 * The props of one catalog item. Manga-native pieces (`registry:component`) get a table of
 * their exported `<Pascal>Props` interface, generated from the source at build time;
 * restyled primitives (`registry:ui`) keep the stock API, so they link to shadcn's page and
 * list only what mangacn adds. Throws on an unknown item.
 */
export async function PropsTable({ item, name = propsInterfaceName(item) }: PropsTableProps) {
  const entry = loadRegistry().items.find((candidate) => candidate.name === item);
  if (!entry) throw new Error(`PropsTable: unknown item "${item}" (not in the catalog).`);

  if (entry.type === "registry:ui") return <PrimitiveProps item={item} />;

  const file = entry.files[0]?.path;
  if (!file) return <PropsFallback item={item} name={name} />;
  return ownPropsTable(item, file, name);
}

/**
 * The generated table, cached for good: the compiler and Shiki run at build time only, never
 * as a background revalidation on the server (where there is no TypeScript to run).
 */
async function ownPropsTable(item: string, file: string, name: string) {
  "use cache";
  cacheLife({ revalidate: Infinity, expire: Infinity });
  const docs = await generateOwnProps(item, file, undefined, name);
  if (!docs) return <PropsFallback item={item} name={name} file={file} />;
  return (
    <div data-slot="props-table">
      <AutoTypeTable generator={resolved(docs)} path={file} name={name} />
    </div>
  );
}

/** A generator that hands AutoTypeTable the docs PropsTable already generated. */
function resolved(docs: GeneratedDoc[]): Generator {
  return {
    generateDocumentation: async () => docs,
    generateTypeTable: async () => docs,
  };
}

function PrimitiveProps({ item }: { item: string }) {
  const delta = PROPS_DELTA[item];
  return (
    <div data-slot="props-table" className="flex flex-col gap-2">
      <p>
        Keeps the stock props: see{" "}
        <a href={shadcnDocsUrl(item)} className={linkClass}>
          shadcn&rsquo;s {item} page
        </a>
        {delta ? ". mangacn adds:" : "."}
      </p>
      {delta && <TypeTable type={toTypeNodes(delta)} />}
    </div>
  );
}

function PropsFallback({ item, name, file }: { item: string; name: string; file?: string }) {
  return (
    <p data-slot="props-table">
      The props table for <code>{name}</code> could not be generated; see{" "}
      {file ? (
        <a href={`${SOURCE_URL}/${file}`} className={linkClass}>
          the {item} source
        </a>
      ) : (
        `the ${item} source`
      )}
      .
    </p>
  );
}

function toTypeNodes(delta: Readonly<Record<string, PropDelta>>): Record<string, TypeNode> {
  return Object.fromEntries(
    Object.entries(delta).map(([name, prop]) => [
      name,
      {
        type: <code>{prop.type}</code>,
        default: prop.default && <code>{prop.default}</code>,
        description: withInlineCode(prop.description),
      },
    ]),
  );
}

/** Renders `backticked` spans of a plain-text description as code. */
function withInlineCode(text: string): ReactNode {
  return text.split("`").map((part, index) =>
    // Odd parts sit between backticks; the parts never reorder, so the index is a stable key.
    // biome-ignore lint/suspicious/noArrayIndexKey: see above
    index % 2 === 1 ? <code key={index}>{part}</code> : part,
  );
}
