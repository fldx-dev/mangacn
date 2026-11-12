/**
 * The headers every registry answer under `/r/` carries: a short browser cache, a longer CDN
 * cache, and open CORS so any tool can fetch the items. `next.config.ts` sets them on the static
 * items (`public/r`); the Create routes (`app/r/create/`) set them on their own answers. No Node
 * imports.
 */

export const REGISTRY_CACHE_CONTROL =
  "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export const REGISTRY_HEADERS: { key: string; value: string }[] = [
  { key: "Cache-Control", value: REGISTRY_CACHE_CONTROL },
  { key: "Access-Control-Allow-Origin", value: "*" },
  { key: "Access-Control-Allow-Methods", value: "GET" },
];
