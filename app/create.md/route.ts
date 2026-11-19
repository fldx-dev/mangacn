import type { NextRequest } from "next/server";
import { createMarkdown } from "@/lib/create/markdown";
import { CODE_PARAM } from "@/lib/create/state";

// GET /create.md?c=<code>: the Create page as Markdown for agents (lib/create/markdown.ts). The
// code is read per request; the text is built from the decoded configuration only, so a bad or
// hostile code gives the default configuration with a note and nothing of the request's text.

export function GET(request: NextRequest) {
  return new Response(createMarkdown(request.nextUrl.searchParams.get(CODE_PARAM)), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
