import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface RegistryFile {
  path: string;
  type: string;
  target?: string;
}

export interface RegistryItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
  categories?: string[];
  dependencies?: string[];
  registryDependencies?: string[];
  meta?: Record<string, unknown>;
  files?: RegistryFile[];
  [key: string]: unknown;
}

export interface LoadedRegistryItem extends RegistryItem {
  files: RegistryFile[];
  /** Repo-relative POSIX path of the registry.json that declares this item. */
  source: string;
}

export interface LoadedRegistry {
  name: string;
  homepage: string;
  items: LoadedRegistryItem[];
}

interface RegistryDocument {
  name?: string;
  homepage?: string;
  include?: string[];
  items?: RegistryItem[];
}

/** Repo-relative path with forward slashes, stable on Windows and Linux. */
function toRepoPath(rootDir: string, absolutePath: string): string {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

function readDocument(file: string, rootDir: string): RegistryDocument {
  if (!existsSync(file)) {
    throw new Error(`Registry file not found: ${toRepoPath(rootDir, file)}`);
  }
  try {
    return JSON.parse(readFileSync(file, "utf8")) as RegistryDocument;
  } catch (error) {
    throw new Error(`Invalid JSON in ${toRepoPath(rootDir, file)}: ${(error as Error).message}`);
  }
}

/**
 * Reads the root registry.json, follows `include` entries (relative to the file that
 * declares them) and returns every item with its file paths rewritten to repo-relative.
 * Throws on duplicate item names, missing registry files, and missing item files.
 */
export function loadRegistry(rootPath = path.resolve("registry.json")): LoadedRegistry {
  const rootFile = path.resolve(rootPath);
  const rootDir = path.dirname(rootFile);
  const root = readDocument(rootFile, rootDir);
  const items: LoadedRegistryItem[] = [];
  const seen = new Map<string, string>();
  const visited = new Set<string>();

  const visit = (file: string, doc: RegistryDocument) => {
    visited.add(file);
    const dir = path.dirname(file);
    const source = toRepoPath(rootDir, file);

    for (const item of doc.items ?? []) {
      const previous = seen.get(item.name);
      if (previous) {
        throw new Error(
          `Duplicate registry item "${item.name}" in ${source} (already declared in ${previous})`,
        );
      }
      seen.set(item.name, source);

      const files = (item.files ?? []).map((entry) => {
        const absolute = path.resolve(dir, entry.path);
        const repoPath = toRepoPath(rootDir, absolute);
        if (!existsSync(absolute)) {
          throw new Error(`Registry item "${item.name}" lists missing file ${repoPath}`);
        }
        return { ...entry, path: repoPath };
      });
      items.push({ ...item, files, source });
    }

    for (const include of doc.include ?? []) {
      const included = path.resolve(dir, include);
      if (visited.has(included)) continue;
      visit(included, readDocument(included, rootDir));
    }
  };

  visit(rootFile, root);

  return { name: root.name ?? "", homepage: root.homepage ?? "", items };
}
