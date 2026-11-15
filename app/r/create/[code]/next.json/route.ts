import type { NextRequest } from "next/server";
import { createResponse } from "@/lib/create/serve";
import { itemOrigin } from "../../origin";

// GET /r/create/<code>/next.json: the bundle (`registry:base`) the new Next.js project command
// starts from. The same preset, theme and kit as /r/create/<code>.json, plus the `font-sans` and
// `font-heading` mappings a new Next.js project needs (lib/create/items.ts, `nextBundleItem`).
// The existing-project command installs /r/create/<code>.json, which maps no font, so it keeps
// the project's own body font. Rendered per request, cached by the CDN (see ../route.ts).

export async function GET(request: NextRequest, ctx: RouteContext<"/r/create/[code]/next.json">) {
  const { code } = await ctx.params;
  return createResponse("next", code, itemOrigin(request));
}
