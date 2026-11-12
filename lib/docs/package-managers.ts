/**
 * The package managers the docs print commands for, and how each runs a package without
 * installing it. No Node imports: the Create page (`lib/create/commands.ts`) prints these in the
 * browser, `./install-command.ts` on the server.
 */

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export const PACKAGE_MANAGERS: PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

/** The prefix that runs a package's CLI once (`npx shadcn@latest …`). */
export const RUNNERS: Record<PackageManager, string> = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
};
