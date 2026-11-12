/**
 * The commands the Create page prints for a configuration (Task C6 shows them), as measured with
 * shadcn 4.23 in Task C1:
 *
 * - a new Next.js or Vite project in one run: `init -t <template> -b base -n <name> -p <bundle>`.
 *   `-p` takes the bundle as the project's preset because it is a `registry:base` item; a
 *   positional URL would lose to the preset's own values. `--yes` keeps it unattended.
 * - an existing project: `add <bundle> --yes --overwrite`. `--overwrite` answers "already exists.
 *   Would you like to overwrite?" for each kit file the project has (an aborted question exits 0
 *   half-applied), so a kit file the user edited is replaced.
 * - the look only: `add <theme> --yes`. `--yes` answers the theme's own question.
 *
 * No Node imports: the page builds these in the browser.
 */

import { type PackageManager, RUNNERS } from "@/lib/docs/package-managers";
import { encode } from "./code";
import type { CreateConfig } from "./config";
import { bundleUrl, SITE_ORIGIN, themeUrl } from "./urls";

/** The folder a new project is created in. */
export const PROJECT_NAME = "my-manga-app";

export interface CreateCommands {
  /** The configuration's short code. */
  code: string;
  /** The bundle (`registry:base`): theme, fonts and kit. */
  bundleUrl: string;
  /** The theme alone (`registry:theme`) with its fonts. */
  themeUrl: string;
  /** A new Next.js project. */
  nextProject: string;
  /** A new Vite project. Vite skips the kit's pages (`registry:page`) without a word. */
  viteProject: string;
  /** A project that already has shadcn: replaces the theme and the kit's files. */
  existingProject: string;
  /** The look only, over a project that has shadcn: theme and fonts, no component. */
  lookOnly: string;
}

/** Every command for `config`, run with `manager` (`npx`, `pnpm dlx` …), items at `origin`. */
export function createCommands(
  config: CreateConfig,
  manager: PackageManager = "npm",
  origin: string = SITE_ORIGIN,
): CreateCommands {
  const code = encode(config);
  const bundle = bundleUrl(code, origin);
  const theme = themeUrl(code, origin);
  const shadcn = `${RUNNERS[manager]} shadcn@latest`;
  const init = (template: "next" | "vite") =>
    `${shadcn} init -t ${template} -b base -n ${PROJECT_NAME} -p ${bundle} --yes`;
  return {
    code,
    bundleUrl: bundle,
    themeUrl: theme,
    nextProject: init("next"),
    viteProject: init("vite"),
    existingProject: `${shadcn} add ${bundle} --yes --overwrite`,
    lookOnly: `${shadcn} add ${theme} --yes`,
  };
}
