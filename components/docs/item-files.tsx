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

/** `a`, `a and b`, `a, b and c`: the paths a sibling block shares, as prose. */
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
 * (SPEC-components-6 §5.1).
 */
export function ItemFiles({ item }: { item: string }) {
  const { files, dependencyFiles, replaces } = itemFiles(item);
  return (
    <p data-slot="item-files">
      <strong>Files:</strong> <Paths paths={files} />
      {dependencyFiles.length > 0 && (
        <>
          ; also adds <Paths paths={dependencyFiles} /> through its registry dependencies
        </>
      )}
      .
      {replaces.map(({ item: other, files: shared }) => (
        <span key={other} data-slot="item-files-replaces">
          {" "}
          Replaces <PathList paths={shared} /> from <code>{other}</code>.
        </span>
      ))}
    </p>
  );
}

/** The same line in Markdown, for the `.md` route, /llms-full.txt and the MCP's `get_page`. */
export function itemFilesMarkdown(item: string): string {
  const { files, dependencyFiles, replaces } = itemFiles(item);
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
    .map(({ item: other, files: shared }) => ` Replaces ${prose(shared)} from \`${other}\`.`)
    .join("");
  return `\n**Files:** ${code(files)}${deps}.${replaced}\n\n`;
}
