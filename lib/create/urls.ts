/**
 * Where a Create code's registry items are served (`app/r/create/`). Codes are the canonical
 * `encode(config)` (`./code.ts`): base-62 digits only, so a URL never needs quoting in a shell.
 * No Node imports: the page prints these in the browser.
 */

/** The site's origin in production; a development server passes its own (`app/r/create/`). */
export const SITE_ORIGIN = "https://www.mangacn.com";

/** The page a person makes a code on. */
export const CREATE_PAGE_URL = `${SITE_ORIGIN}/create`;

/** A static registry item: `https://www.mangacn.com/r/<name>.json`. */
export function registryUrl(name: string, origin: string = SITE_ORIGIN): string {
  return `${origin}/r/${name}.json`;
}

/** The bundle (`registry:base`) a code installs: `…/r/create/<code>.json`. */
export function bundleUrl(code: string, origin: string = SITE_ORIGIN): string {
  return `${origin}/r/create/${code}.json`;
}

/** The generated theme (`registry:theme`) of a code: `…/r/create/<code>/theme.json`. */
export function themeUrl(code: string, origin: string = SITE_ORIGIN): string {
  return `${origin}/r/create/${code}/theme.json`;
}
