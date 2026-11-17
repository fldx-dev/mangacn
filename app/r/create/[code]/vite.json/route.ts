import type { NextRequest } from "next/server";
import { createResponse } from "@/lib/create/serve";
import { itemOrigin } from "../../origin";

// GET /r/create/<code>/vite.json: the bundle (`registry:base`) the new Vite project command
// starts from. The same preset, theme and kit as /r/create/<code>.json, plus the `font-sans` a
// Vite project needs (lib/create/items.ts, `viteBundleItem`). Rendered per request, cached by the
// CDN (see ../route.ts).

export async function GET(request: NextRequest, ctx: RouteContext<"/r/create/[code]/vite.json">) {
  const { code } = await ctx.params;
  return createResponse("vite", code, itemOrigin(request));
}
