/**
 * Writes lib/docs/props.generated.json, the props table of every manga-native item, from the
 * items' sources through the TypeScript compiler (lib/docs/typescript.ts). The docs pages, the
 * `.md` routes and the MCP route read the file, so no route needs the compiler at runtime (the
 * Vercel function has none). The file is committed; it changes only when a props interface or
 * its JSDoc does.
 *
 * Usage: pnpm gen:props          (rewrite the file when it changed)
 *        pnpm gen:props --check  (write nothing; exit 1 when the file is missing or stale)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PROPS_GENERATED_PATH } from "../lib/docs/props";
import { propsTargets, renderPropsFile } from "../lib/docs/typescript";

const check = process.argv.includes("--check");

// pnpm runs package scripts from the repo root.
const file = path.resolve(PROPS_GENERATED_PATH);

async function main(): Promise<number> {
  let props: string;
  let count: number;
  try {
    const targets = propsTargets();
    count = targets.length;
    props = await renderPropsFile(targets);
  } catch (error) {
    console.error(`✗ ${(error as Error).message}`);
    return 1;
  }

  // A checkout with CRLF line endings holds the same tables; compare the content.
  const current = existsSync(file) && readFileSync(file, "utf8").replace(/\r\n/g, "\n") === props;
  const upToDate = `✓ ${PROPS_GENERATED_PATH} is up to date (${count} tables)`;

  if (check) {
    if (current) {
      console.log(upToDate);
      return 0;
    }
    console.error(`✗ ${PROPS_GENERATED_PATH} is out of date`);
    console.error("  run `pnpm gen:props` to rewrite it");
    return 1;
  }

  if (current) {
    console.log(upToDate);
  } else {
    writeFileSync(file, props);
    console.log(`✓ wrote ${PROPS_GENERATED_PATH} (${count} tables)`);
  }
  return 0;
}

// The compiler runs as a child process; exit rather than wait for it.
main().then((code) => process.exit(code));
