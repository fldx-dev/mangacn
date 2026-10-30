/**
 * Smoke-installs every built registry item into a throwaway Next.js + shadcn project,
 * then typechecks and builds that project. See SPEC-registry-core §7.
 *
 * Usage: pnpm registry:build && pnpm registry:smoke
 */
import { type ChildProcess, execFileSync, type SpawnOptions, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

const NEXT_VERSION = "16.4.3";
const SHADCN_VERSION = "4.23.0";
// Hang guard: a budget for creating the project plus one per item, because `shadcn add` takes
// 30–40 s per item on Windows (under a second on Linux CI) and the catalog keeps growing.
const SETUP_TIMEOUT_MS = 5 * 60 * 1000;
const ITEM_TIMEOUT_MS = 60 * 1000;
const isWindows = process.platform === "win32";

// pnpm runs package scripts from the repo root.
const outputDir = path.resolve("public", "r");

/**
 * Attribution comment of every restyled primitive (registry/ui/README.md, recipe 1). It sits
 * right after the imports: `shadcn add` drops anything above a file's first statement.
 */
const ATTRIBUTION = "// Based on shadcn/ui ";
const attribution = (name: string) => `${ATTRIBUTION}${name} (MIT, https://ui.shadcn.com)`;

/** What an installed item must leave in the temp project, keyed by item name. */
const EXPECTED_CONTENT: Record<
  string,
  { file: string; attribution?: string; includes?: string[] }[]
> = {
  theme: [
    {
      file: "app/globals.css",
      includes: ["--ink:", "--paper:", "--spot:", "@utility halftone", "@keyframes mangacn-shake"],
    },
  ],
  "font-display": [{ file: "app/layout.tsx", includes: ["Dela_Gothic_One(", "--font-display"] }],
  "font-dialogue": [{ file: "app/layout.tsx", includes: ["Shantell_Sans(", "--font-dialogue"] }],
  "manga-motion": [{ file: "lib/manga-motion.ts", includes: ["export const popIn"] }],
  // registry:component with `target: "@components/ink-frame.tsx"` (SPEC-components §4.4).
  "ink-frame": [{ file: "components/ink-frame.tsx", includes: ["export function InkFrame"] }],
  // button overwrites the stock button pre-installed after `shadcn init`.
  button: [{ file: "components/ui/button.tsx", attribution: attribution("Button") }],
  badge: [{ file: "components/ui/badge.tsx", attribution: attribution("Badge") }],
  separator: [{ file: "components/ui/separator.tsx", attribution: attribution("Separator") }],
  // Manga-native pieces: registry:component with `target: "@components/<name>.tsx"`.
  panel: [{ file: "components/panel.tsx", includes: ["export function Panel("] }],
  "panel-grid": [{ file: "components/panel-grid.tsx", includes: ["export function PanelGrid("] }],
  "speech-bubble": [
    { file: "components/speech-bubble.tsx", includes: ["export function SpeechBubble("] },
  ],
  "thought-bubble": [
    { file: "components/thought-bubble.tsx", includes: ["export function ThoughtBubble("] },
  ],
  "sfx-text": [{ file: "components/sfx-text.tsx", includes: ["export function SfxText("] }],
  "vertical-text": [
    { file: "components/vertical-text.tsx", includes: ["export function VerticalText("] },
  ],
  "speed-lines": [
    { file: "components/speed-lines.tsx", includes: ["export function SpeedLines("] },
  ],
  "focus-lines": [
    { file: "components/focus-lines.tsx", includes: ["export function FocusLines("] },
  ],
  "halftone-background": [
    {
      file: "components/halftone-background.tsx",
      includes: ["export function HalftoneBackground("],
    },
  ],
  emanata: [{ file: "components/emanata.tsx", includes: ["export function Emanata("] }],
  "ink-splash-loader": [
    { file: "components/ink-splash-loader.tsx", includes: ["export function InkSplashLoader("] },
  ],
  "page-turn": [{ file: "components/page-turn.tsx", includes: ["export function PageTurn("] }],
  "manga-frame": [
    { file: "components/manga-frame.tsx", includes: ["export function MangaFrame("] },
  ],
};

/** True when `line` is the attribution comment and only imports or a directive precede it. */
function hasAttributionHeader(content: string, line: string): boolean {
  const index = content.indexOf(line);
  if (index === -1) return false;
  const preamble = stripImports(content.slice(0, index));
  return /^\s*(["']use client["'];?\s*)?$/.test(preamble);
}

/** Removes import statements (including multi-line ones) from a module preamble. */
function stripImports(source: string): string {
  return source.replace(
    /^import\s[\s\S]*?\sfrom\s*["'][^"']+["'];?$|^import\s*["'][^"']+["'];?$/gm,
    "",
  );
}

/**
 * Installed before every other mangacn item, in this order. Outlined items import
 * `@/components/ink-frame` without declaring it (a bare registryDependency would resolve to
 * shadcn's registry, a namespaced one breaks URL installs), so users add it first; see
 * SPEC-components §4.4.
 */
const INSTALL_FIRST = ["ink-frame"];

/** Stock shadcn items installed before the mangacn items, which must overwrite them. */
const STOCK_PREINSTALL = [{ name: "button", file: "components/ui/button.tsx" }];

class SmokeError extends Error {
  constructor(
    message: string,
    readonly output = "",
  ) {
    super(message);
  }
}

let currentChild: ChildProcess | undefined;
let projectDir: string | undefined;
let timer: NodeJS.Timeout | undefined;

function armTimeout(ms: number) {
  timer = setTimeout(() => {
    if (currentChild) killTree(currentChild);
    console.error(`✗ registry smoke timed out after ${Math.round(ms / 60000)} min`);
    if (projectDir) console.error(`Temp project kept for inspection: ${projectDir}`);
    process.exit(1);
  }, ms);
}

function killTree(child: ChildProcess) {
  if (child.pid === undefined || child.exitCode !== null) return;
  if (isWindows) {
    try {
      execFileSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // already gone
    }
  } else {
    child.kill("SIGKILL");
  }
}

/** Runs a command non-interactively, capturing combined output; rejects on non-zero exit. */
function run(command: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: SpawnOptions = {
      cwd,
      env: { ...process.env, CI: "1", NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    };
    // pnpm is a .cmd shim on Windows, which needs a shell to launch. Every argument here is a
    // fixed flag or a kebab-case item name, so joining them into one command line is safe.
    const child: ChildProcess = isWindows
      ? spawn([command, ...args].join(" "), { ...options, shell: true })
      : spawn(command, args, options);
    currentChild = child;
    let output = "";
    child.stdout?.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", (error) => reject(new SmokeError(error.message, output)));
    child.on("close", (code) => {
      currentChild = undefined;
      if (code === 0) resolve(output);
      else reject(new SmokeError(`\`${command} ${args.join(" ")}\` exited with ${code}`, output));
    });
  });
}

/** Serves `public/r` at `/r/*` on a free port. */
function serveRegistry(): Promise<Server> {
  const server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    const relative = pathname.replace(/^\/r\//, "");
    const file = path.join(outputDir, relative);
    if (
      !pathname.startsWith("/r/") ||
      !file.startsWith(outputDir + path.sep) ||
      !existsSync(file)
    ) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" }).end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

/** Content hashes of every project file outside node_modules/.next, keyed by POSIX path. */
function snapshot(dir: string): Map<string, string> {
  const result = new Map<string, string>();
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else {
        const key = path.relative(dir, full).split(path.sep).join("/");
        result.set(key, createHash("sha1").update(readFileSync(full)).digest("hex"));
      }
    }
  };
  walk(dir);
  return result;
}

/** Maps tool output that mentions installed files back to the items that wrote them. */
function blame(output: string, owners: Map<string, string>): string[] {
  const normalized = output.replaceAll("\\", "/");
  const items = new Set<string>();
  for (const [file, item] of owners) {
    if (normalized.includes(file)) items.add(item);
  }
  return [...items];
}

async function main() {
  const catalogPath = path.join(outputDir, "registry.json");
  if (!existsSync(catalogPath)) {
    throw new SmokeError("public/r/registry.json not found. Run `pnpm registry:build` first.");
  }
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as { items: { name: string }[] };
  const listed = catalog.items.map((item) => item.name);
  for (const name of INSTALL_FIRST) {
    if (!listed.includes(name)) throw new SmokeError(`"${name}" is missing from the catalog`);
  }
  const names = [...INSTALL_FIRST, ...listed.filter((name) => !INSTALL_FIRST.includes(name))];
  console.log(`Smoke-installing ${names.length} item(s): ${names.join(", ")}`);
  armTimeout(SETUP_TIMEOUT_MS + names.length * ITEM_TIMEOUT_MS);

  const workDir = mkdtempSync(path.join(tmpdir(), "mangacn-smoke-"));
  const project = path.join(workDir, "app");
  projectDir = project;
  const server = await serveRegistry();
  const { port } = server.address() as AddressInfo;

  let failed = true;
  try {
    console.log(`→ create-next-app@${NEXT_VERSION} in ${project}`);
    await run(
      "pnpm",
      [
        "dlx",
        `create-next-app@${NEXT_VERSION}`,
        "app",
        "--ts",
        "--tailwind",
        "--biome",
        "--app",
        "--no-src-dir",
        "--use-pnpm",
        "--disable-git",
        "--no-agent-feedback",
        "--yes",
      ],
      workDir,
    );

    console.log(`→ shadcn@${SHADCN_VERSION} init`);
    await run("pnpm", ["dlx", `shadcn@${SHADCN_VERSION}`, "init", "-d", "--yes"], project);

    const componentsPath = path.join(project, "components.json");
    const components = JSON.parse(readFileSync(componentsPath, "utf8"));
    components.registries = {
      ...components.registries,
      "@mangacn": `http://127.0.0.1:${port}/r/{name}.json`,
    };
    writeFileSync(componentsPath, `${JSON.stringify(components, null, 2)}\n`);

    for (const stock of STOCK_PREINSTALL) {
      console.log(`→ shadcn add ${stock.name} (stock, to be overwritten)`);
      await run("pnpm", ["dlx", `shadcn@${SHADCN_VERSION}`, "add", stock.name, "--yes"], project);
      const full = path.join(project, stock.file);
      if (!existsSync(full) || readFileSync(full, "utf8").includes(ATTRIBUTION)) {
        throw new SmokeError(`Stock ${stock.name} did not install a stock ${stock.file}`);
      }
    }

    const owners = new Map<string, string>();
    for (const name of names) {
      console.log(`→ shadcn add @mangacn/${name}`);
      const before = snapshot(project);
      try {
        await run(
          "pnpm",
          ["dlx", `shadcn@${SHADCN_VERSION}`, "add", `@mangacn/${name}`, "--yes", "--overwrite"],
          project,
        );
      } catch (error) {
        const output = error instanceof SmokeError ? error.output : "";
        throw new SmokeError(`Item "${name}" failed to install`, output);
      }
      for (const [file, hash] of snapshot(project)) {
        if (before.get(file) !== hash && file !== "package.json" && file !== "pnpm-lock.yaml") {
          owners.set(file, name);
        }
      }
    }

    console.log("→ installed content");
    const missing: string[] = [];
    for (const name of names) {
      for (const { file, attribution, includes = [] } of EXPECTED_CONTENT[name] ?? []) {
        const full = path.join(project, file);
        if (!existsSync(full)) {
          missing.push(`${name}: ${file} was not installed`);
          continue;
        }
        const content = readFileSync(full, "utf8");
        if (attribution && !hasAttributionHeader(content, attribution)) {
          missing.push(`${name}: ${file} lacks the header "${attribution}" after its imports`);
        }
        for (const needle of includes) {
          if (!content.includes(needle)) missing.push(`${name}: ${file} lacks "${needle}"`);
        }
      }
    }
    if (missing.length > 0) {
      throw new SmokeError(`Installed content check failed:\n  ${missing.join("\n  ")}`);
    }

    const check = async (label: string, args: string[]) => {
      console.log(`→ ${label}`);
      try {
        await run("pnpm", args, project);
      } catch (error) {
        const output = error instanceof SmokeError ? error.output : "";
        const culprits = blame(output, owners);
        const who = culprits.length > 0 ? `item(s) ${culprits.join(", ")}` : "no specific item";
        throw new SmokeError(`${label} failed (${who})`, output);
      }
    };
    await check("tsc --noEmit", ["exec", "tsc", "--noEmit"]);
    await check("next build", ["exec", "next", "build"]);

    failed = false;
    console.log(`✓ ${names.length} item(s) installed, typechecked and built`);
  } finally {
    server.close();
    if (failed) {
      console.error(`Temp project kept for inspection: ${project}`);
    } else {
      rmSync(workDir, { recursive: true, force: true, maxRetries: 3 });
    }
  }
}

main()
  .then(() => {
    clearTimeout(timer);
  })
  .catch((error: unknown) => {
    clearTimeout(timer);
    if (error instanceof SmokeError && error.output) console.error(error.output.trimEnd());
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
