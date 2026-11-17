import { answerResponse, fontAnswer } from "@/lib/create/serve";

// GET /r/create/font/<role>/<id>.json: a curated face's `registry:font` item (lib/create/fonts.ts),
// which a Create code's theme depends on when it names an alternative face. The segment is
// `<id>.json`; an unknown role or id is 404 with a fixed message. The answer depends on the path
// alone (no origin inside), so the CDN caches it like the static items.

export async function GET(_request: Request, ctx: RouteContext<"/r/create/font/[role]/[id]">) {
  const { role, id } = await ctx.params;
  return answerResponse(fontAnswer(role, id));
}
