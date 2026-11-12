/**
 * What `/r/create/<code>.json` and `/r/create/<code>/theme.json` answer (`app/r/create/`), as a
 * pure function the routes and `scripts/registry-smoke.ts` share. A code `decode` accepts gets its
 * item with the registry's cache and CORS headers (a code's answer never changes: a version never
 * changes meaning). Anything else gets 404 with a `message` a person can act on: shadcn 4.23
 * prints a server's message only for 401, 403 and 404 (Task C1). The message holds `decode`'s
 * reason, which names numbers and fixed words only, never the request's text. No Node imports.
 */

import { REGISTRY_HEADERS } from "@/lib/registry/headers";
import { decode } from "./code";
import { bundleItem, themeItem } from "./items";
import { CREATE_PAGE_URL } from "./urls";

/** Which of a code's two items a route serves. */
export type CreateItemKind = "bundle" | "theme";

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

/**
 * The answer for one route. `segment` is the dynamic path segment as the router gives it: the
 * bundle's is `<code>.json`, the theme's `<code>`. `origin` is where the items' dependencies are
 * fetched from (the site in production, the dev server in development).
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
  const item =
    kind === "bundle" ? bundleItem(result.config, origin) : themeItem(result.config, origin);
  return { status: 200, headers: SUCCESS_HEADERS, body: item };
}

/** `createAnswer` as a web `Response`, laid out like the static items (two-space JSON). */
export function createResponse(kind: CreateItemKind, segment: unknown, origin: string): Response {
  const { status, headers, body } = createAnswer(kind, segment, origin);
  return new Response(`${JSON.stringify(body, null, 2)}\n`, { status, headers });
}
