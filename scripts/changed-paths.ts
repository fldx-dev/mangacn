import { execFileSync } from "node:child_process";

const git = (args: string[]) =>
  execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/** `origin/main`, or `main` when there is no remote branch (a fresh clone without fetch). */
export function defaultBase(): string {
  try {
    git(["rev-parse", "--verify", "--quiet", "origin/main"]);
    return "origin/main";
  } catch {
    return "main";
  }
}

/**
 * Repo-relative POSIX paths that differ from `base`: committed since the merge base
 * (`base...HEAD`), staged or unstaged, and untracked. Deleted paths are included.
 */
export function changedPaths(base = defaultBase()): {
  base: string;
  mergeBase: string;
  paths: string[];
} {
  const lines = (args: string[]) => git(args).split(/\r?\n/).filter(Boolean);
  const mergeBase = git(["merge-base", base, "HEAD"]).trim();
  const paths = new Set([
    ...lines(["diff", "--name-only", `${mergeBase}`, "HEAD"]),
    ...lines(["diff", "--name-only", "HEAD"]),
    ...lines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  return { base, mergeBase, paths: [...paths].sort() };
}

/** A file's content at `ref`, or `undefined` when it does not exist there. */
export function fileAt(ref: string, file: string): string | undefined {
  try {
    return git(["show", `${ref}:${file}`]);
  } catch {
    return undefined;
  }
}
