import type { NextRequest } from "next/server";
import { SITE_ORIGIN } from "@/lib/create/urls";

/**
 * Where a Create item's dependencies are fetched from: the dev server in development, so a local
 * `shadcn init -p http://localhost:3000/r/create/<code>.json` installs this checkout's build; the
 * site everywhere else, so a preview or a proxy never puts its own host into an item.
 */
export function itemOrigin(request: NextRequest): string {
  return process.env.NODE_ENV === "development" ? request.nextUrl.origin : SITE_ORIGIN;
}
