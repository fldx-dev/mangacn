/**
 * Renders the `theme` registry item, then the `css` of any other item (sfx-ticker's keyframes),
 * to app/mangacn-theme.css, the stylesheet the docs app imports, so the site and the registry
 * cannot drift. See SPEC-manga-theme §4.
 *
 * Theme presets (Task 99, lib/registry/theme-presets.ts): first writes each
 * registry/theme/presets/<name>.json into the theme catalog as the item `theme-<name>`, then the
 * docs site's scoped preset stylesheet, app/mangacn-presets.css.
 *
 * Usage: pnpm gen:theme (also runs in predev/prebuild)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadRegistry } from "../lib/registry/index";
import { renderThemeCssFile, THEME_CSS_PATH } from "../lib/registry/theme-css";
import {
  defaultThemeOf,
  loadPresets,
  PRESETS_CSS_PATH,
  renderPresetsCss,
  renderThemeCatalog,
  THEME_CATALOG_PATH,
} from "../lib/registry/theme-preset-items";

/** Writes `content` to the repo-relative `file` unless it is already there. */
function write(file: string, content: string, note = ""): void {
  // pnpm runs package scripts from the repo root.
  const target = path.resolve(file);
  if (existsSync(target) && readFileSync(target, "utf8") === content) {
    console.log(`✓ ${file} is up to date`);
  } else {
    writeFileSync(target, content);
    console.log(`✓ wrote ${file}${note}`);
  }
}

const presets = loadPresets();
const catalog = renderThemeCatalog(readFileSync(path.resolve(THEME_CATALOG_PATH), "utf8"), presets);
write(THEME_CATALOG_PATH, catalog, " (preset items; run `pnpm registry:build` again)");
write(THEME_CSS_PATH, renderThemeCssFile(loadRegistry()));
write(PRESETS_CSS_PATH, renderPresetsCss(defaultThemeOf(JSON.parse(catalog)), presets));
