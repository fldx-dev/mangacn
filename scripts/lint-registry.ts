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

/** Rule failures accepted for now, by file. Each group says what removes it. */
const ALLOWED: Record<string, string[]> = {
  // A plain `<a href="/">` in a block. The upcoming link-component task (a swappable
  // `lib/link.tsx` that renders the app's router link) removes these entries.
  "registry/blocks/login-02/page.tsx": [LINK],
  "registry/blocks/login-03/page.tsx": [LINK],
  "registry/blocks/login-05/components/login-form.tsx": [LINK],
  "registry/blocks/sidebar-08/components/app-sidebar.tsx": [LINK],
  "registry/blocks/sidebar-09/components/app-sidebar.tsx": [LINK],
  "registry/blocks/signup-02/page.tsx": [LINK],
  "registry/blocks/signup-03/page.tsx": [LINK],
  "registry/blocks/signup-05/components/signup-form.tsx": [LINK],
  // Found when this check was added, outside its task (which fixed use-mobile, profile-01,
  // upload-01 and spread-viewer): a follow-up fixes each one and removes its entry.
  "registry/ui/banner/banner.tsx": ["react-hooks/set-state-in-effect"],
  "registry/ui/carousel/carousel.tsx": ["react-hooks/set-state-in-effect"],
  "registry/ui/data-table/data-table.tsx": [
    "react-hooks/refs",
    "@typescript-eslint/no-explicit-any",
  ],
  "registry/ui/kanban/kanban.tsx": ["react-hooks/refs", "react-hooks/immutability"],
  "registry/ui/phone-input/phone-input.tsx": ["react-hooks/set-state-in-effect"],
  "registry/ui/rich-text-editor/rich-text-editor.tsx": ["react-hooks/refs"],
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
  for (const result of results) {
    const file = relative(process.cwd(), result.filePath).replaceAll("\\", "/");
    const allowedRules = ALLOWED[file] ?? [];
    for (const message of result.messages) {
      if (message.ruleId && allowedRules.includes(message.ruleId)) {
        allowed += 1;
        continue;
      }
      if (message.severity === 2) errors += 1;
      const level = message.severity === 2 ? "error" : "warning";
      const text = message.message.split("\n")[0];
      console.log(`${file}:${message.line}:${message.column} ${level} ${message.ruleId} ${text}`);
    }
  }

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
