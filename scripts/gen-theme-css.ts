/**
 * Renders the `theme` registry item to app/mangacn-theme.css, the stylesheet the docs app
 * imports, so the site and the registry cannot drift. See SPEC-manga-theme §4.
 *
 * Usage: pnpm gen:theme (also runs in predev/prebuild)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadRegistry } from "../lib/registry/index";
import { renderThemeCssFile, THEME_CSS_PATH } from "../lib/registry/theme-css";

// pnpm runs package scripts from the repo root.
const target = path.resolve(THEME_CSS_PATH);
const css = renderThemeCssFile(loadRegistry());

if (existsSync(target) && readFileSync(target, "utf8") === css) {
  console.log(`✓ ${THEME_CSS_PATH} is up to date`);
} else {
  writeFileSync(target, css);
  console.log(`✓ wrote ${THEME_CSS_PATH}`);
}
