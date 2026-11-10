import { SpreadViewer } from "@/registry/blocks/spread-viewer/spread-viewer";

// Sample pages as inline SVG, so the demo needs no files: a cover, then three panel layouts in
// turn, each page's number in its first panel. Any image URLs work.
const LAYOUTS = [
  ["12,12,276,170", "12,194,132,194", "156,194,132,194"],
  ["12,12,276,118", "12,142,276,118", "12,272,276,116"],
  ["12,12,132,376", "156,12,132,182", "156,206,132,182"],
];
const KINDS = [
  "a wide panel over two tall ones",
  "three stacked panels",
  "a tall panel beside two",
];

function pageArt(n: number): string {
  const body =
    n === 1
      ? `<rect width="300" height="400" fill="#222"/><circle cx="150" cy="170" r="70" fill="#fafafa"/><text x="150" y="330" font-family="Arial, sans-serif" font-weight="700" font-size="40" fill="#fafafa" text-anchor="middle">INK WELL</text>`
      : LAYOUTS[n % 3]
          .map((rect, i) => {
            const [x, y, w, h] = rect.split(",");
            const fill = ["#ededed", "#d6d6d6", "#bdbdbd"][(n + i) % 3];
            return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#222" stroke-width="4"/>`;
          })
          .join("") +
        `<text x="28" y="66" font-family="Arial, sans-serif" font-weight="700" font-size="40" fill="#222">${n}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#fafafa"/>${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const pages = Array.from({ length: 24 }, (_, i) => ({
  src: pageArt(i + 1),
  alt: i === 0 ? "Cover: Ink Well, a white moon on black" : `Page ${i + 1}: ${KINDS[(i + 1) % 3]}`,
}));

export default function SpreadViewerDefaultDemo() {
  // Right to left, as a manga reads: page 4 on the right, 5 on the left; Left arrow reads on.
  return <SpreadViewer pages={pages} start={3} label="Ink Well, chapter 1" />;
}
