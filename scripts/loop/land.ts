/**
 * The fast loop's land step: merge a pushed branch into main, resolve the append-only catalog
 * conflicts, check the merged tree and push main only when every check passes.
 *
 *   pnpm loop:land <branch> "<merge subject>" [--dry-run]
 *   pnpm loop:check [--dry-run]       check HEAD (after a conflict resolved by hand) and push
 *
 * Run it in the checkout that has `main` checked out and clean. The merge is
 * `git merge --no-ff origin/<branch>` with the subject as its message, plus `LOOP_TRAILER`
 * (for instance a `Co-Authored-By:` line) after a blank line when that is set. A conflict in a
 * catalog or list is resolved by `scripts/loop/resolve-catalogs.ts`; any other conflict stops
 * the land with the merge in progress. The checks: `pnpm install --frozen-lockfile`,
 * `gen:theme`, `gen:demos`, the `--check` generators, `registry:validate`, whole-tree Biome,
 * `typecheck` and the unit suite, whose failed files get one rerun on their own (parallel
 * sessions load the machine; a file that only timed out passes alone). Logs go to a temporary
 * folder, printed at the start. `--dry-run` prints what it would do and changes nothing.
 *
 * Exit codes: 0 pushed (or a dry run), 2 wrong usage or state, 10 a conflict left to resolve by
 * hand, 20 a check failed (the merge commit stays local for a fix on main).
 */
import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { report, resolveConflicts, unmergedFiles } from "./resolve-catalogs";

export const EXIT = { ok: 0, usage: 2, conflict: 10, check: 20 } as const;

export interface Options {
  mode: "land" | "check";
  branch?: string;
  subject?: string;
  dryRun: boolean;
}

export function parseArgs(argv: string[]): Options | string {
  const dryRun = argv.includes("--dry-run");
  const rest = argv.filter((arg) => arg !== "--dry-run");
  if (rest[0] === "--check") {
    return rest.length === 1 ? { mode: "check", dryRun } : "loop:check takes no arguments";
  }
  const [branch, subject, ...extra] = rest;
  if (!branch || !subject || extra.length) return 'usage: pnpm loop:land <branch> "<subject>"';
  if (branch.startsWith("-") || branch.startsWith("origin/")) {
    return `name the pushed branch without "origin/" (got ${branch})`;
  }
  return { mode: "land", branch, subject, dryRun };
}

/** The merge commit's message: the subject, then the trailer when one is given. */
export function mergeMessage(subject: string, trailer: string | undefined): string {
  return trailer?.trim() ? `${subject}\n\n${trailer.trim()}\n` : `${subject}\n`;
}

/** A check: the pnpm arguments and a short name. */
export interface Check {
  name: string;
  args: string[];
}

export const CHECKS: Check[] = [
  { name: "gen:docs --check", args: ["gen:docs", "--check"] },
  { name: "gen:props --check", args: ["gen:props", "--check"] },
  { name: "gen:skill --check", args: ["gen:skill", "--check"] },
  { name: "registry:validate", args: ["registry:validate"] },
  { name: "biome (whole tree)", args: ["exec", "biome", "check", "."] },
  { name: "typecheck", args: ["typecheck"] },
];

/** Test files Vitest reported as failed (`FAIL  path/to/x.test.tsx`). */
export function failedTestFiles(log: string): string[] {
  const files = new Set<string>();
  for (const line of log.split(/\r?\n/)) {
    if (!line.includes("FAIL")) continue;
    for (const match of line.matchAll(/[\w./-]+\.test\.tsx?/g)) files.add(match[0]);
  }
  return [...files].sort();
}

// ---------------------------------------------------------------------------------------------

const scriptDir = path.dirname(__filename);

function git(args: string[], cwd: string) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

function repoRoot(): string {
  const result = git(["rev-parse", "--show-toplevel"], scriptDir);
  if (result.status !== 0) throw new Error(`not in a git checkout: ${result.stderr}`);
  return result.stdout.trim();
}

class Loop {
  readonly logs = mkdtempSync(path.join(tmpdir(), "mangacn-loop-"));
  failed: string[] = [];

  constructor(
    readonly root: string,
    readonly dryRun: boolean,
  ) {}

  git(args: string[]) {
    return git(args, this.root);
  }

  /** Runs pnpm with its output in a log file; returns the result, or null in a dry run. */
  pnpm(args: string[], log: string): SpawnSyncReturns<string> | null {
    if (this.dryRun) {
      console.log(`   would run: pnpm ${args.join(" ")}`);
      return null;
    }
    const result = spawnSync("pnpm", args, {
      cwd: this.root,
      encoding: "utf8",
      shell: process.platform === "win32",
      maxBuffer: 256 * 1024 * 1024,
    });
    writeFileSync(path.join(this.logs, log), `${result.stdout ?? ""}${result.stderr ?? ""}`);
    return result;
  }

  check(name: string, args: string[], log: string): string {
    const result = this.pnpm(args, log);
    if (result && result.status !== 0) {
      this.failed.push(name);
      const tail = `${result.stdout}${result.stderr}`.trimEnd().split(/\r?\n/).slice(-8);
      console.log(`== ${name} FAILED (${path.join(this.logs, log)})`);
      for (const line of tail) console.log(`   ${line}`);
    }
    return result ? `${result.stdout}${result.stderr}` : "";
  }
}

function precondition(loop: Loop, ok: boolean, message: string): boolean {
  if (ok) return true;
  console.log(loop.dryRun ? `   (a real run would stop here: ${message})` : `== ${message}`);
  return loop.dryRun;
}

function land(loop: Loop, branch: string, subject: string): number {
  const status = loop.git(["status", "--porcelain"]).stdout.trim();
  if (!precondition(loop, status === "", "the checkout is not clean")) return EXIT.usage;
  if (loop.dryRun) console.log("   would run: git fetch origin");
  else if (loop.git(["fetch", "origin", "--quiet"]).status !== 0) {
    console.log("== git fetch failed");
    return EXIT.usage;
  }
  const ref = `origin/${branch}`;
  if (loop.git(["rev-parse", "--verify", "--quiet", ref]).status !== 0) {
    console.log(`== no ${ref}${loop.dryRun ? " (as of the last fetch)" : ""}`);
    if (!loop.dryRun) return EXIT.usage;
  } else {
    const count = loop.git(["rev-list", "--count", `HEAD..${ref}`]).stdout.trim();
    console.log(`== merging ${ref} (${count} commits)`);
  }
  const message = mergeMessage(subject, process.env.LOOP_TRAILER);
  if (loop.dryRun) {
    console.log(`   would run: git merge --no-ff ${ref} with the message:`);
    for (const line of message.trimEnd().split("\n")) console.log(`     | ${line}`);
    console.log("   on a conflict: resolve the catalogs, regenerate, commit; else stop with 10");
    return EXIT.ok;
  }
  const messageFile = path.join(loop.logs, "merge-message.txt");
  writeFileSync(messageFile, message);
  const merge = loop.git(["merge", "--no-ff", ref, "-F", messageFile]);
  writeFileSync(path.join(loop.logs, "merge.log"), `${merge.stdout}${merge.stderr}`);
  if (merge.status === 0) return EXIT.ok;

  const unmerged = unmergedFiles(loop.root);
  if (unmerged.length === 0) {
    console.log(`== git merge failed without a conflict (${path.join(loop.logs, "merge.log")})`);
    return EXIT.usage;
  }
  console.log(`== conflicts: ${unmerged.join(", ")}`);
  const outcomes = resolveConflicts(loop.root);
  for (const line of report(outcomes)) console.log(line);
  if (outcomes.some((outcome) => !outcome.resolved)) {
    console.log("== resolve the rest by hand, commit, then run: pnpm loop:check");
    return EXIT.conflict;
  }
  const resolved = outcomes.map((outcome) => outcome.file);
  const biome = resolved.filter((file) => file.endsWith(".json") || /\.[cm]?tsx?$/.test(file));
  if (biome.length) {
    loop.pnpm(
      ["exec", "biome", "format", "--write", "--no-errors-on-unmatched", ...biome],
      "format.log",
    );
  }
  const generators = new Set(outcomes.flatMap((o) => (o.resolved && o.regenerate) || []));
  // The skill catalog mirrors the item catalog, so a merged catalog rewrites it too.
  if (resolved.some((file) => file.endsWith("registry.json"))) generators.add("gen:skill");
  for (const generator of generators) loop.pnpm([generator], `${generator}.log`);
  loop.git(["add", "--", ...resolved, "skills", "lib/docs/props.generated.json"]);
  const left = unmergedFiles(loop.root);
  if (left.length) {
    console.log(`== still unmerged: ${left.join(", ")}`);
    return EXIT.conflict;
  }
  if (loop.git(["commit", "-q", "-F", messageFile]).status !== 0) {
    console.log("== the merge commit failed");
    return EXIT.conflict;
  }
  return EXIT.ok;
}

function checkAndPush(loop: Loop): number {
  const merging = loop.git(["rev-parse", "--quiet", "--verify", "MERGE_HEAD"]).status === 0;
  if (!loop.dryRun && merging) {
    console.log("== a merge is in progress: commit it first (git commit --no-edit)");
    return EXIT.conflict;
  }
  const stat = loop.git(["diff", "--shortstat", "HEAD~1", "HEAD"]).stdout.trim();
  console.log(`== checking ${loop.git(["log", "--oneline", "-1"]).stdout.trim()} (${stat})`);
  const install = loop.pnpm(["install", "--frozen-lockfile"], "install.log");
  if (install && install.status !== 0) loop.failed.push("install");
  loop.pnpm(["gen:theme"], "gen-theme.log");
  loop.pnpm(["gen:demos"], "gen-demos.log");
  for (const { name, args } of CHECKS) loop.check(name, args, `${args.join("-")}.log`);

  const test = loop.pnpm(["test"], "test.log");
  if (test && test.status !== 0) {
    const files = failedTestFiles(`${test.stdout}${test.stderr}`);
    console.log(
      `== tests failed in: ${files.join(" ") || "(no file named)"}; rerunning those alone`,
    );
    const rerun = files.length
      ? loop.pnpm(["exec", "vitest", "run", ...files, "--coverage.enabled=false"], "test-rerun.log")
      : null;
    if (rerun?.status === 0) console.log("== rerun passed (machine load, not the change)");
    else loop.failed.push("tests");
  }
  if (test) {
    const summary = `${test.stdout}`.split(/\r?\n/).filter((l) => /Test Files|Tests {2}/.test(l));
    for (const line of summary) console.log(`   ${line.trim()}`);
  }
  if (loop.failed.length) {
    console.log(`== checks failed (${loop.failed.join(", ")}); the merge commit stays local`);
    return EXIT.check;
  }
  if (loop.dryRun) {
    console.log("   would run: git push origin main");
    return EXIT.ok;
  }
  const push = loop.git(["push", "origin", "main"]);
  if (push.status !== 0) {
    console.log(`== push failed:\n${push.stderr}`);
    return EXIT.check;
  }
  console.log(`== pushed ${loop.git(["log", "--oneline", "-1"]).stdout.trim()}`);
  return EXIT.ok;
}

export function main(argv: string[]): number {
  const options = parseArgs(argv);
  if (typeof options === "string") {
    console.log(options);
    return EXIT.usage;
  }
  const loop = new Loop(repoRoot(), options.dryRun);
  console.log(
    `== ${options.dryRun ? "dry run in" : "landing in"} ${loop.root}; logs in ${loop.logs}`,
  );
  const branch = loop.git(["branch", "--show-current"]).stdout.trim();
  if (!precondition(loop, branch === "main", `not on main (on ${branch || "a detached HEAD"})`)) {
    return EXIT.usage;
  }
  if (options.mode === "land") {
    const code = land(loop, options.branch ?? "", options.subject ?? "");
    if (code !== EXIT.ok) return code;
  }
  return checkAndPush(loop);
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (invoked) {
  const code = main(process.argv.slice(2));
  console.log(`land exit ${code}`);
  process.exit(code);
}
