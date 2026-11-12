import type * as React from "react";
import { createHighlighterCoreSync, type ThemeRegistration } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bash from "shiki/langs/shellscript.mjs";
import tsx from "shiki/langs/tsx.mjs";
import { inkDark, inkLight } from "@/lib/docs/code-theme";

// Synchronous shiki in the docs' ink themes, for the code-block demos: they highlight while they
// render, on the server, so the code never shows unhighlighted first. Each token is a span shaped
// like the ones stock's lib/highlighter.tsx returns (the colours in `--shiki-light` and
// `--shiki-dark`), plus the themes' weight and slant, which carry keywords and comments here.

const highlighter = createHighlighterCoreSync({
  themes: [inkLight as ThemeRegistration, inkDark as ThemeRegistration],
  langs: [tsx, bash],
  engine: createJavaScriptRegexEngine(),
});

/** One React node per line of `code` (a trailing newline adds no line), in the ink themes. */
export function highlightInk(code: string, lang: "tsx" | "bash"): React.ReactNode[] {
  const { tokens } = highlighter.codeToTokens(code.replace(/\n$/, ""), {
    lang: lang === "bash" ? "shellscript" : lang,
    themes: { light: inkLight.name, dark: inkDark.name },
    defaultColor: false,
  });
  return tokens.map((line) =>
    line.map((token, index) => (
      <span
        // biome-ignore lint/suspicious/noArrayIndexKey: a line's tokens never reorder
        key={index}
        style={token.htmlStyle as React.CSSProperties}
        className="text-(--shiki-light) [font-style:var(--shiki-light-font-style)] font-(--shiki-light-font-weight) dark:text-(--shiki-dark) dark:[font-style:var(--shiki-dark-font-style)] dark:font-(--shiki-dark-font-weight)"
      >
        {token.content}
      </span>
    )),
  );
}
