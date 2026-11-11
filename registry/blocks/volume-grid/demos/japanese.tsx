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

const titles = ["墨の井戸", "網点の空", "コマの向こう", "裁ち落とし"];

const volumes = titles.map((title, i) => ({
  number: i + 1,
  title,
  cover: { src: cover(i + 1, "INK WELL"), alt: `第${i + 1}巻の表紙。灰色の網点に黒い図形` },
  href: `#volume-${i + 1}`,
  date: `2026/${String(i * 3 + 1).padStart(2, "0")}/05`,
  isNew: i === titles.length - 1,
}));

export default function VolumeGridJapaneseDemo() {
  // lang on the nav covers the titles; the block sets it on the numerals and the stamp.
  return <VolumeGrid volumes={volumes} numerals="ja" label="単行本一覧" lang="ja" />;
}
