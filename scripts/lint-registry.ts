/**
 * ESLint on every registry item's source with the rules a fresh Next 16 app lints with:
 * `create-next-app`'s eslint.config.mjs, eslint-config-next's core-web-vitals and typescript
 * configs (the React Compiler rules of eslint-plugin-react-hooks included). Biome passing here
 * does not mean a user's `npm run lint` passes after `shadcn add`; this does. Errors fail,
 * warnings are printed (a fresh app's lint passes with them).
 *
 * Usage: pnpm lint:registry [file ...]   (no files: every item's .ts and .tsx files)
 */
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { ESLint, type Linter } from "eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const REGISTRIES = ["theme", "ui", "blocks", "hooks"];

const LINK = "@next/next/no-html-link-for-pages";

/**
 * Rule errors accepted for now: how many, by file and rule. More than the count fails (a new
 * error of an accepted rule is still an error), and so does fewer (the entry is stale: lower the
 * count, or remove the rule and then the file when it reaches 0). Each group says what removes it.
 */
const ALLOWED: Record<string, Record<string, number>> = {
  // A plain `<a href="/">` in a block. The upcoming link-component task (a swappable
  // `lib/link.tsx` that renders the app's router link) removes these entries.
  "registry/blocks/login-02/page.tsx": { [LINK]: 1 },
  "registry/blocks/login-03/page.tsx": { [LINK]: 1 },
  "registry/blocks/login-05/components/login-form.tsx": { [LINK]: 1 },
  "registry/blocks/sidebar-08/components/app-sidebar.tsx": { [LINK]: 1 },
  "registry/blocks/sidebar-09/components/app-sidebar.tsx": { [LINK]: 1 },
  "registry/blocks/signup-02/page.tsx": { [LINK]: 1 },
  "registry/blocks/signup-03/page.tsx": { [LINK]: 1 },
  "registry/blocks/signup-05/components/signup-form.tsx": { [LINK]: 1 },
};

interface RegistryCatalog {
  items: { files?: { path: string }[] }[];
}

/** The `.ts` and `.tsx` files every item ships, from each registry's catalog. */
function registryFiles(): string[] {
  const files = REGISTRIES.flatMap((name) => {
    const catalog = JSON.parse(
      readFileSync(`registry/${name}/registry.json`, "utf8"),
    ) as RegistryCatalog;
    return catalog.items.flatMap((item) =>
      (item.files ?? []).map((file) => `registry/${name}/${file.path}`),
    );
  });
  return [...new Set(files)].filter((file) => /\.tsx?$/.test(file)).sort();
}

async function main() {
  const args = process.argv.slice(2);
  const files = args.length > 0 ? args : registryFiles();
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [...nextVitals, ...nextTs] as Linter.Config[],
  });
  const results = await eslint.lintFiles(files);

  let errors = 0;
  let allowed = 0;
  const problems: string[] = [];
  const print = (file: string, message: Linter.LintMessage) => {
    const level = message.severity === 2 ? "error" : "warning";
    const text = message.message.split("\n")[0];
    console.log(`${file}:${message.line}:${message.column} ${level} ${message.ruleId} ${text}`);
  };
  for (const result of results) {
    const file = relative(process.cwd(), result.filePath).replaceAll("\\", "/");
    const expected = ALLOWED[file] ?? {};
    const byRule = new Map<string, Linter.LintMessage[]>();
    for (const message of result.messages) {
      if (message.severity !== 2 || !message.ruleId || !(message.ruleId in expected)) {
        if (message.severity === 2) errors += 1;
        print(file, message);
        continue;
      }
      byRule.set(message.ruleId, [...(byRule.get(message.ruleId) ?? []), message]);
    }
    for (const [rule, count] of Object.entries(expected)) {
      const found = byRule.get(rule) ?? [];
      if (found.length === count) {
        allowed += count;
        continue;
      }
      errors += 1;
      if (found.length > count) {
        for (const message of found) print(file, message);
        problems.push(
          `${file}: ${found.length} ${rule} error(s), ALLOWED accepts ${count}. Fix the new one(s); raise the count only for an accepted case.`,
        );
      } else {
        problems.push(
          `${file}: ${found.length} ${rule} error(s), ALLOWED accepts ${count}: stale. Set the count in scripts/lint-registry.ts to ${found.length}${found.length === 0 ? " (remove the rule, and the file when it has none left)" : ""}.`,
        );
      }
    }
  }
  // A full run also reports an entry whose file no item ships any more.
  if (args.length === 0) {
    for (const file of Object.keys(ALLOWED).filter((entry) => !files.includes(entry))) {
      errors += 1;
      problems.push(`${file}: in ALLOWED but no item ships it: stale. Remove its entry.`);
    }
  }

  for (const problem of problems) console.error(problem);
  const suffix = allowed > 0 ? ` (${allowed} allowed, see ALLOWED)` : "";
  if (errors > 0) {
    console.error(`✗ lint-registry: ${errors} error(s) in ${files.length} file(s)${suffix}`);
    process.exit(1);
  }
  console.log(`✓ lint-registry: ${files.length} file(s) lint clean under Next 16${suffix}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
