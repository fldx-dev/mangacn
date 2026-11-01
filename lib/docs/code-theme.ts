// Shiki themes for the docs code blocks: ink on paper, no hue. No built-in theme is greyscale
// (min-light colours keywords red and strings green, vesper strings mint, github purple and
// blue), so these are drawn from the manga theme's palette: ink for code, tone-4 for strings,
// comments and punctuation, weight and italics instead of colour. Hex values are the sRGB of
// the theme's OKLCH tokens (registry/theme/registry.json).

interface InkPalette {
  ink: string;
  paper: string;
  wash: string;
}

function inkTheme(name: string, type: "light" | "dark", { ink, paper, wash }: InkPalette) {
  return {
    name,
    type,
    colors: { "editor.background": paper, "editor.foreground": ink },
    settings: [
      { settings: { foreground: ink, background: paper } },
      {
        scope: ["comment", "punctuation.definition.comment"],
        settings: { foreground: wash, fontStyle: "italic" },
      },
      {
        scope: ["string", "markup.inline.raw", "markup.fenced_code"],
        settings: { foreground: wash },
      },
      // `keyword.operator` would inherit the keyword weight; the empty style resets it.
      {
        scope: ["punctuation", "meta.brace", "keyword.operator"],
        settings: { foreground: wash, fontStyle: "" },
      },
      {
        scope: ["keyword", "storage", "storage.type", "markup.heading", "markup.bold"],
        settings: { foreground: ink, fontStyle: "bold" },
      },
      {
        scope: ["keyword.operator.new", "keyword.operator.expression"],
        settings: { foreground: ink, fontStyle: "bold" },
      },
      { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
    ],
  };
}

/** Light: ink `oklch(0.16 0.005 60)`, paper `oklch(0.985 0.008 85)`, tone-4 `oklch(0.42 0 0)`. */
export const inkLight = inkTheme("mangacn-ink-light", "light", {
  ink: "#0f0d0b",
  paper: "#fdfaf4",
  wash: "#4d4d4d",
});

/** Dark: ink `oklch(0.93 0.004 85)`, paper `oklch(0.24 0.004 60)`, tone-4 `oklch(0.73 0 0)`. */
export const inkDark = inkTheme("mangacn-ink-dark", "dark", {
  ink: "#e9e8e5",
  paper: "#211f1d",
  wash: "#a8a8a8",
});
