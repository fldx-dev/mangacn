import type * as React from "react";
import {
  createHighlighterCore,
  type GrammarState,
  type HighlighterCore,
  type ThemeRegistration,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// Based on shadcn/ui use-highlighted-code's highlighter (MIT, https://ui.shadcn.com), base-nova style,
// fetched 2026-11-12. Restyled for mangacn: tokens come out in ink instead of GitHub's colours. The
// ink theme below is drawn from the theme's own tokens (CSS variables), so one theme serves light
// and dark mode and every preset: code in the foreground, strings, comments and punctuation in the
// muted foreground, keywords set bold and comments italic instead of coloured. Each token span
// also takes the theme's weight and slant.

const fg = "var(--foreground)";
const muted = "var(--muted-foreground)";

const ink: ThemeRegistration = {
  name: "mangacn-ink",
  type: "light",
  colors: { "editor.background": "var(--background)", "editor.foreground": fg },
  settings: [
    { settings: { foreground: fg } },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: muted, fontStyle: "italic" },
    },
    {
      scope: ["string", "markup.inline.raw", "markup.fenced_code"],
      settings: { foreground: muted },
    },
    // `keyword.operator` would inherit the keyword weight; the empty style resets it.
    {
      scope: ["punctuation", "meta.brace", "keyword.operator"],
      settings: { foreground: muted, fontStyle: "" },
    },
    {
      scope: ["keyword", "storage", "storage.type", "markup.heading", "markup.bold"],
      settings: { foreground: fg, fontStyle: "bold" },
    },
    {
      scope: ["keyword.operator.new", "keyword.operator.expression"],
      settings: { foreground: fg, fontStyle: "bold" },
    },
    { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
  ],
};

// Add the languages you need. Each one loads the first time it is used.
const languages = {
  bash: () => import("shiki/langs/shellscript.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
};

const aliases: Record<string, keyof typeof languages> = {
  js: "javascript",
  md: "markdown",
  py: "python",
  sh: "bash",
  shell: "bash",
  shellscript: "bash",
  ts: "typescript",
  yml: "yaml",
  zsh: "bash",
};

let highlighter: Promise<HighlighterCore> | undefined;

function getHighlighter() {
  highlighter ??= createHighlighterCore({
    // To use other themes, load them here and name them in `themes` below, e.g. stock's
    // import("shiki/themes/github-light.mjs") and import("shiki/themes/github-dark.mjs").
    themes: [ink],
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });

  return highlighter;
}

function getLanguage(language: string) {
  const name = language.toLowerCase();

  if (name === "ansi") {
    return name;
  }

  if (name in languages) {
    return name as keyof typeof languages;
  }

  return aliases[name] ?? null;
}

// Loads a language and returns a highlighter for it, or null for a language
// that is not listed.
export async function loadHighlighter(language: string) {
  const lang = getLanguage(language);

  if (!lang) {
    return null;
  }

  const shiki = await getHighlighter();

  if (lang !== "ansi" && !shiki.getLoadedLanguages().includes(lang)) {
    await shiki.loadLanguage(languages[lang]);
  }

  return {
    // Returns one React node per line, and the grammar state after the last
    // line. Pass that state back to continue where the code left off.
    highlight(code: string, state?: GrammarState) {
      const tokenize = (text: string) =>
        shiki.codeToTokens(text, {
          lang,
          themes: { light: "mangacn-ink", dark: "mangacn-ink" },
          defaultColor: false,
          grammarState: state,
        }).tokens;

      // ANSI has no grammar state, so each line is tokenized on its own and
      // gets the same colors whether it arrives in one piece or streams.
      const tokens =
        lang === "ansi" ? code.split("\n").flatMap((line) => tokenize(line)) : tokenize(code);

      return {
        lines: tokens.map((line) =>
          line.map((token, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: stock's; a line's tokens never reorder
              key={index}
              style={token.htmlStyle as React.CSSProperties}
              className="text-(--shiki-light) [font-style:var(--shiki-light-font-style)] font-(--shiki-light-font-weight) dark:text-(--shiki-dark) dark:[font-style:var(--shiki-dark-font-style)] dark:font-(--shiki-dark-font-weight)"
            >
              {token.content}
            </span>
          )),
        ),
        state: shiki.getLastGrammarState(tokens),
      };
    },
  };
}

// Returns one React node per line, or null for a language that is not listed.
export async function highlightCode(code: string, language: string) {
  const highlighter = await loadHighlighter(language);

  return highlighter ? highlighter.highlight(code).lines : null;
}
