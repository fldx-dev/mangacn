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

/** The bundle a new Next.js project starts from (it maps the body font): `…/r/create/<code>/next.json`. */
export function nextBundleUrl(code: string, origin: string = SITE_ORIGIN): string {
  return `${origin}/r/create/${code}/next.json`;
}

/** The bundle a new Vite project starts from (its body font differs): `…/r/create/<code>/vite.json`. */
export function viteBundleUrl(code: string, origin: string = SITE_ORIGIN): string {
  return `${origin}/r/create/${code}/vite.json`;
}

/** A curated face's `registry:font` item: `…/r/create/font/<role>/<id>.json`. */
export function fontUrl(role: string, id: string, origin: string = SITE_ORIGIN): string {
  return `${origin}/r/create/font/${role}/${id}.json`;
}
