import { VolumeGrid } from "@/registry/blocks/volume-grid/volume-grid";

// Covers as inline SVG, so the demo needs no files: a title band over a screentone field and a
// shape that changes per volume. Any image URLs work.
function cover(n: number, title: string): string {
  const fill = ["#ededed", "#d6d6d6", "#bdbdbd"][n % 3];
  const shape =
    n % 2 === 0
      ? `<circle cx="100" cy="170" r="${40 + (n % 4) * 8}" fill="#222"/>`
      : `<rect x="50" y="${110 + (n % 3) * 10}" width="100" height="110" fill="#222" transform="rotate(${n * 7} 100 170)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="${fill}"/>${shape}<rect x="0" y="0" width="200" height="58" fill="#fafafa"/><text x="100" y="38" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#222" text-anchor="middle">${title}</text><text x="178" y="285" font-family="Arial, sans-serif" font-weight="700" font-size="28" fill="#fafafa" text-anchor="end">${n}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const titles = ["The Ink Well", "Paper Lanterns", "Night Market", "Gutter Talk", "The Last Panel"];

const volumes = titles.map((title, i) => ({
  number: i + 1,
  title,
  cover: {
    src: cover(i + 1, "INK WELL"),
    alt: `Volume ${i + 1} cover: a black shape on grey tone`,
  },
  href: `#volume-${i + 1}`,
  date: ["Jan 2026", "Apr 2026", "Jul 2026", "Sep 2026", "Nov 2026"][i],
  isNew: i === titles.length - 1,
}));

export default function VolumeGridDefaultDemo() {
  // Two covers a row on phones, three from sm, four from md; the newest stamped NEW.
  return <VolumeGrid volumes={volumes} label="Ink Well volumes" />;
}
