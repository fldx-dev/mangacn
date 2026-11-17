/**
 * What `/r/create/<code>.json`, `/r/create/<code>/next.json`, `/r/create/<code>/vite.json`,
 * `/r/create/<code>/theme.json` and
 * `/r/create/font/<role>/<id>.json` answer (`app/r/create/`), as a
 * pure function the routes and `scripts/registry-smoke.ts` share. A code `decode` accepts gets its
 * item with the registry's cache and CORS headers (a code's answer never changes: a version never
 * changes meaning). Anything else gets 404 with a `message` a person can act on: shadcn 4.23
 * prints a server's message only for 401, 403 and 404 (Task C1). The message holds `decode`'s
 * reason, which names numbers and fixed words only, never the request's text. No Node imports.
 */

import { REGISTRY_HEADERS } from "@/lib/registry/headers";
import { decode } from "./code";
import { bundleItem, fontItem, nextBundleItem, themeItem, viteBundleItem } from "./items";
import { CREATE_PAGE_URL } from "./urls";

/** Which of a code's items a route serves: the bundle, a new project's bundle or the theme. */
export type CreateItemKind = "bundle" | "next" | "vite" | "theme";

export interface CreateAnswer {
  status: 200 | 404;
  headers: Record<string, string>;
  body: object;
}

const JSON_TYPE = "application/json";
const CORS = Object.fromEntries(
  REGISTRY_HEADERS.filter(({ key }) => key.startsWith("Access-Control-")).map(({ key, value }) => [
    key,
    value,
  ]),
);

/** On success: the headers `next.config.ts` gives every static item under `/r/`. */
export const SUCCESS_HEADERS: Record<string, string> = {
  "Content-Type": JSON_TYPE,
  ...Object.fromEntries(REGISTRY_HEADERS.map(({ key, value }) => [key, value])),
};

/**
 * On failure: the same CORS, but no caching. A code of a version this deploy does not know may
 * be valid after the next one.
 */
export const FAILURE_HEADERS: Record<string, string> = {
  "Content-Type": JSON_TYPE,
  "Cache-Control": "no-store",
  ...CORS,
};

export function invalidMessage(reason: string): string {
  return `This Create code is not valid: ${reason}. Make one at ${CREATE_PAGE_URL}.`;
}

function notFound(reason: string): CreateAnswer {
  return { status: 404, headers: FAILURE_HEADERS, body: { message: invalidMessage(reason) } };
}

/** What builds each kind's item. */
const BUILDERS = {
  bundle: bundleItem,
  next: nextBundleItem,
  vite: viteBundleItem,
  theme: themeItem,
} as const;

/**
 * The answer for one route. `segment` is the dynamic path segment as the router gives it: the
 * bundle's is `<code>.json`, the project bundles' and the theme's `<code>`. `origin` is where the
 * items' dependencies are fetched from (the site in production, the dev server in development).
 */
export function createAnswer(kind: CreateItemKind, segment: unknown, origin: string): CreateAnswer {
  let code: unknown = segment;
  if (kind === "bundle") {
    if (typeof segment !== "string" || !segment.endsWith(".json")) {
      return notFound("the address must end in .json");
    }
    code = segment.slice(0, -".json".length);
  }
  const result = decode(code);
  if (!result.ok) return notFound(result.reason);
  return { status: 200, headers: SUCCESS_HEADERS, body: BUILDERS[kind](result.config, origin) };
}

/** The message for a font address the curated list does not have. It never repeats the request. */
export const UNKNOWN_FONT_MESSAGE = `This is not a Create font. Choose one at ${CREATE_PAGE_URL}.`;

/**
 * The answer for `/r/create/font/<role>/<id>.json`: a curated face's `registry:font` item, or 404
 * with a fixed message. `segment` is the last path segment, `<id>.json`.
 */
export function fontAnswer(role: unknown, segment: unknown): CreateAnswer {
  const id =
    typeof segment === "string" && segment.endsWith(".json")
      ? segment.slice(0, -".json".length)
      : undefined;
  const item = typeof role === "string" && id !== undefined ? fontItem(role, id) : undefined;
  if (!item) {
    return { status: 404, headers: FAILURE_HEADERS, body: { message: UNKNOWN_FONT_MESSAGE } };
  }
  return { status: 200, headers: SUCCESS_HEADERS, body: item };
}

/** An answer as a web `Response`, laid out like the static items (two-space JSON). */
export function answerResponse({ status, headers, body }: CreateAnswer): Response {
  return new Response(`${JSON.stringify(body, null, 2)}\n`, { status, headers });
}

/** `createAnswer` as a web `Response`. */
export function createResponse(kind: CreateItemKind, segment: unknown, origin: string): Response {
  return answerResponse(createAnswer(kind, segment, origin));
}
