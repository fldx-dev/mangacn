import { createFromSource } from "fumadocs-core/search/server";
import { source } from "./source";

/** The docs search index: `/api/search` serves its `GET`, the MCP `search` tool its `search()`. */
export const searchServer = createFromSource(source, { language: "english" });
