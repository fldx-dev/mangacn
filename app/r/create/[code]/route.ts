import type { NextRequest } from "next/server";
import { createResponse } from "@/lib/create/serve";
import { itemOrigin } from "../origin";

// GET /r/create/<code>.json: the Create bundle (`registry:base`) a code installs. The segment is
// `<code>.json`; `lib/create/serve.ts` checks the suffix and the code. Rendered per request (the
// code is a runtime param); the answer is a pure function of the code, so the CDN caches it like
// the static items. Static files in public/r win over this route, and none is named `create`.

export async function GET(request: NextRequest, ctx: RouteContext<"/r/create/[code]">) {
  const { code } = await ctx.params;
  return createResponse("bundle", code, itemOrigin(request));
}
