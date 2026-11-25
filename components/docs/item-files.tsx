import { itemFiles } from "@/lib/docs/install-command";

/** One list of paths, each as code, comma-separated. */
function Paths({ paths }: { paths: readonly string[] }) {
  return paths.map((file, index) => (
    <span key={file}>
      {index > 0 && ", "}
      <code>{file}</code>
    </span>
  ));
}

/** `a`, `a and b`, `a, b and c`: the paths sibling blocks share, or the siblings, as prose. */
function PathList({ paths }: { paths: readonly string[] }) {
  return paths.map((file, index) => (
    <span key={file}>
      {index === 0 ? "" : index === paths.length - 1 ? " and " : ", "}
      <code>{file}</code>
    </span>
  ));
}

/**
 * The "Files" line of a block's page (SPEC-components-3 §5): every file one add writes, the
 * block's own first, then what its mangacn registry dependencies add, read from the catalog;
 * then, for a variant of a stock family, the shipped blocks whose files it replaces
 * (SPEC-components-6 §5.1); then, for a page block, the URL its example route serves and that
 * the route group's folder is safe to delete.
 */
export function ItemFiles({ item }: { item: string }) {
  const { files, dependencyFiles, replaces, example } = itemFiles(item);
  return (
    <p data-slot="item-files">
      <strong>Files:</strong> <Paths paths={files} />
      {dependencyFiles.length > 0 && (
        <>
          ; also adds <Paths paths={dependencyFiles} /> through its registry dependencies
        </>
      )}
      .
      {replaces.map(({ items: others, files: shared }) => (
        <span key={others.join()} data-slot="item-files-replaces">
          {" "}
          Replaces <PathList paths={shared} /> from <PathList paths={others} />.
        </span>
      ))}
      {example && (
        <span data-slot="item-files-example">
          {" "}
          The page is an example route at <code>{example.url}</code>, under{" "}
          <code>{example.folder}</code> with every block's example route: deleting that folder
          removes the example routes and leaves the components.
        </span>
      )}
    </p>
  );
}

/** The same line in Markdown, for the `.md` route, /llms-full.txt and the MCP's `get_page`. */
export function itemFilesMarkdown(item: string): string {
  const { files, dependencyFiles, replaces, example } = itemFiles(item);
  const quote = (paths: readonly string[]) => paths.map((file) => `\`${file}\``);
  const code = (paths: readonly string[]) => quote(paths).join(", ");
  const prose = (paths: readonly string[]) => {
    const quoted = quote(paths);
    return quoted.length < 2
      ? quoted.join("")
      : `${quoted.slice(0, -1).join(", ")} and ${quoted.at(-1)}`;
  };
  const deps =
    dependencyFiles.length > 0
      ? `; also adds ${code(dependencyFiles)} through its registry dependencies`
      : "";
  const replaced = replaces
    .map(({ items: others, files: shared }) => ` Replaces ${prose(shared)} from ${prose(others)}.`)
    .join("");
  const route = example
    ? ` The page is an example route at \`${example.url}\`, under \`${example.folder}\` with every block's example route: deleting that folder removes the example routes and leaves the components.`
    : "";
  return `\n**Files:** ${code(files)}${deps}.${replaced}${route}\n\n`;
}
