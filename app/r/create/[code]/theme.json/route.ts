import type { NextRequest } from "next/server";
import { createResponse } from "@/lib/create/serve";
import { itemOrigin } from "../../origin";

// GET /r/create/<code>/theme.json: the theme (`registry:theme`) of a code, which the bundle
// depends on and the "look only" command adds on its own. Rendered per request, cached by the CDN
// (see ../route.ts).

export async function GET(request: NextRequest, ctx: RouteContext<"/r/create/[code]/theme.json">) {
  const { code } = await ctx.params;
  return createResponse("theme", code, itemOrigin(request));
}
