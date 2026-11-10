// mangacn logo kit — direction A "Speech": a hand-inked speech bubble that says m.
// Dela Gothic One outlines (OFL) + rough.js ink, in the site's theme colours.
// Usage: node kit.js <outDir>
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");
const rough = require("roughjs/bundled/rough.cjs.js");

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

// Theme colours (app/mangacn-theme.css, converted from OKLCH).
function oklch(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  const f = (x) => Math.max(0, Math.min(1, x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055));
  return "#" + lin.map((v) => Math.round(f(v) * 255).toString(16).padStart(2, "0")).join("");
}
const LIGHT = { ink: oklch(0.16, 0.005, 60), paper: oklch(0.985, 0.008, 85), spot: oklch(0.57, 0.22, 27) };
const DARK = { ink: oklch(0.93, 0.004, 85), paper: oklch(0.24, 0.004, 60), spot: oklch(0.66, 0.21, 27) };

const font = opentype.loadSync(path.join(__dirname, "fonts/DelaGothicOne.ttf"));
const gen = rough.generator({ options: { preserveVertices: true } });
const rp = (dr) => gen.toPaths(dr).map((p) => {
  const fill = p.fill && p.fill !== "none" ? p.fill : "none";
  const stroke = p.stroke && p.stroke !== "none" ? p.stroke : "none";
  const sw = stroke !== "none" ? ` stroke-width="${p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"` : "";
  return `<path d="${p.d}" fill="${fill}" stroke="${stroke}"${sw}/>`;
}).join("");
const R = {
  path: (d, o) => rp(gen.path(d, o)),
  ellipse: (x, y, w, h, o) => rp(gen.ellipse(x, y, w, h, o)),
  poly: (pts, o) => rp(gen.polygon(pts, o)),
};
function glyph(text, cx, cy, size, ls = 0, maxW = Infinity) {
  const bb = font.getPath(text, 0, 0, size, { letterSpacing: ls }).getBoundingBox();
  if (bb.x2 - bb.x1 > maxW) return glyph(text, cx, cy, (size * maxW) / (bb.x2 - bb.x1), ls);
  const q = font.getPath(text, cx - (bb.x1 + bb.x2) / 2, cy - (bb.y1 + bb.y2) / 2, size, { letterSpacing: ls });
  return { d: q.toPathData(2), bb: q.getBoundingBox() };
}
// Wordmark placed by its left edge and x-height centre.
function wordAt(x, xhCentre, xh) {
  const size = xh / (font.tables.os2.sxHeight / font.unitsPerEm);
  const p = font.getPath("mangacn", 0, 0, size, { letterSpacing: -0.02 });
  const bb = p.getBoundingBox();
  const q = font.getPath("mangacn", x - bb.x1, xhCentre + xh / 2, size, { letterSpacing: -0.02 });
  return { d: q.toPathData(2), bb: q.getBoundingBox() };
}

const svg = (w, h, title, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img"><title>${title}</title>` +
  (bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : "") + body + `</svg>\n`;
const write = (name, s) => fs.writeFileSync(path.join(OUT, name), s.replace(/(\d+\.\d)\d+/g, "$1"));

const solid = (seed, fill, x = {}) => ({ seed, fill, fillStyle: "solid", stroke: "none", roughness: 1.2, ...x });
const pen = (seed, fill, ink, x = {}) => ({ seed, fill, fillStyle: "solid", stroke: ink, strokeWidth: 7, roughness: 1.3, bowing: 1.2, ...x });
const inked = (d, seed, c, sw = 3) =>
  R.path(d, solid(seed, c, { roughness: 0.6 })) + R.path(d, { seed: seed + 1, stroke: c, strokeWidth: sw, roughness: 1.1, bowing: 0.8 });

// ---- The symbol (256 grid). Bubble centre (128,104), 212×168; tail lower-left; shadow +12.
const TAIL = [[84, 182], [48, 234], [128, 194]];
const SH = 12;
function symbol(c, { small = false, mono = false, seed = 11 } = {}) {
  const sw = small ? 16 : 7;
  const rough_ = small ? 0.7 : 1.3;
  let b = "";
  if (!mono) {
    b += R.ellipse(128 + SH, 104 + SH, 212, 168, solid(seed, c.spot, { roughness: small ? 0.6 : 1.4 }));
    b += R.poly(TAIL.map(([x, y]) => [x + SH, y + SH]), solid(seed + 2, c.spot, { roughness: small ? 0.5 : 1 }));
  }
  const fill = mono ? "none" : c.paper;
  if (mono) {
    // one-colour: no fills, so the tail is an open stroke that starts on the bubble's edge
    b += R.path("M84 182L48 234L128 194", { seed: seed + 3, stroke: c.ink, strokeWidth: sw, roughness: 1.2 });
  } else {
    b += R.poly(TAIL, pen(seed + 3, fill, c.ink, { strokeWidth: sw, roughness: small ? 0.5 : 1.2 }));
  }
  b += R.ellipse(128, 104, 212, 168, pen(seed + 4, fill, c.ink, { strokeWidth: sw, roughness: rough_, bowing: small ? 0.5 : 1.2 }));
  const m = glyph("m", 128, 102, small ? 170 : 150, 0, small ? 150 : 128).d;
  b += small ? R.path(m, solid(seed + 5, c.ink, { roughness: 0.3 })) : inked(m, seed + 5, c.ink, 4);
  return b;
}

const T = "mangacn";
const MONO_BLACK = { ink: "#000000" }, MONO_WHITE = { ink: "#ffffff" }, MONO_RED = { ink: LIGHT.spot };

// Symbol masters
write("mangacn-symbol.svg", svg(256, 256, T, symbol(LIGHT)));
write("mangacn-symbol-dark.svg", svg(256, 256, T, symbol(DARK)));
write("mangacn-symbol-small.svg", svg(256, 256, T, symbol(LIGHT, { small: true })));
write("mangacn-symbol-small-dark.svg", svg(256, 256, T, symbol(DARK, { small: true })));
write("mangacn-symbol-black.svg", svg(256, 256, T, symbol(MONO_BLACK, { mono: true })));
write("mangacn-symbol-white.svg", svg(256, 256, T, symbol(MONO_WHITE, { mono: true })));
write("mangacn-symbol-red.svg", svg(256, 256, T, symbol(MONO_RED, { mono: true })));

// Lockups. x-height of the wordmark = 0.42 × symbol height; centred on the bubble centre.
const XH = 86;
function horizontal(c, mono, small = false) {
  const w = wordAt(288, 104, XH);
  const W = Math.ceil(w.bb.x2 + 24);
  // the small version (site header, < 48 px tall) pairs the small-cut bubble with solid letters
  const word = small ? R.path(w.d, solid(91, c.ink, { roughness: 0.3 })) : inked(w.d, 91, c.ink, 3);
  return [W, 256, symbol(c, { mono, small }) + word];
}
function stacked(c, mono) {
  const w0 = wordAt(0, 0, XH);
  const ww = w0.bb.x2 - w0.bb.x1;
  const W = Math.ceil(ww + 48);
  const symX = (W - 256) / 2;
  const w = wordAt(24, 256 + 30 + XH / 2 + 14, XH);
  const H = Math.ceil(w.bb.y2 + 24);
  return [W, H, `<g transform="translate(${symX.toFixed(1)} 0)">${symbol(c, { mono })}</g>` + inked(w.d, 92, c.ink, 3)];
}
function wordmark(c) {
  const w = wordAt(24, 128, XH * 1.3);
  return [Math.ceil(w.bb.x2 + 24), 256, inked(w.d, 93, c.ink, 3)];
}
const sets = {
  "": [LIGHT, false], "-dark": [DARK, false], "-black": [MONO_BLACK, true], "-white": [MONO_WHITE, true], "-red": [MONO_RED, true],
};
for (const [suf, [c, mono]] of Object.entries(sets)) {
  let [w, h, b] = horizontal(c, mono); write(`mangacn-horizontal${suf}.svg`, svg(w, h, T, b));
  [w, h, b] = stacked(c, mono); write(`mangacn-stacked${suf}.svg`, svg(w, h, T, b));
  [w, h, b] = wordmark(c); write(`mangacn-wordmark${suf}.svg`, svg(w, h, T, b));
}
for (const [suf, c] of [["", LIGHT], ["-dark", DARK]]) {
  const [w, h, b] = horizontal(c, false, true);
  write(`mangacn-horizontal-small${suf}.svg`, svg(w, h, T, b));
}
// Versions on their own backgrounds, for previews and for the board
write("mangacn-horizontal-dark-bg.svg", svg(...horizontal(DARK, false).slice(0, 2), T, horizontal(DARK, false)[2], DARK.paper));
write("mangacn-app-icon.svg", svg(256, 256, T, `<rect width="256" height="256" rx="56" fill="${LIGHT.paper}"/><g transform="translate(30 26) scale(.76)">${symbol(LIGHT, { small: true })}</g>`));

fs.writeFileSync(path.join(OUT, "palette.json"), JSON.stringify({ light: LIGHT, dark: DARK }, null, 2));
console.log("kit ok", LIGHT, DARK);
