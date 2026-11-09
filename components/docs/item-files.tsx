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

/**
 * The "Files" line of a block's page (SPEC-components-3 §5): every file one add writes, the
 * block's own first, then what its mangacn registry dependencies add, read from the catalog.
 */
export function ItemFiles({ item }: { item: string }) {
  const { files, dependencyFiles } = itemFiles(item);
  return (
    <p data-slot="item-files">
      <strong>Files:</strong> <Paths paths={files} />
      {dependencyFiles.length > 0 && (
        <>
          ; also adds <Paths paths={dependencyFiles} /> through its registry dependencies
        </>
      )}
      .
    </p>
  );
}

/** The same line in Markdown, for the `.md` route, /llms-full.txt and the MCP's `get_page`. */
export function itemFilesMarkdown(item: string): string {
  const { files, dependencyFiles } = itemFiles(item);
  const code = (paths: readonly string[]) => paths.map((file) => `\`${file}\``).join(", ");
  const deps =
    dependencyFiles.length > 0
      ? `; also adds ${code(dependencyFiles)} through its registry dependencies`
      : "";
  return `\n**Files:** ${code(files)}${deps}.\n\n`;
}
