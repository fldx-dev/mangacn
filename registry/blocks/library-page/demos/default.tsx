import { ContinueReading } from "@/registry/blocks/library-page/components/continue-reading";
import { Shelf } from "@/registry/blocks/library-page/components/shelf";

// Covers as inline SVG, so the demo needs no files. Any image URLs work.
function cover(title: string, n: number): string {
  const fill = ["#ededed", "#d6d6d6", "#bdbdbd"][n % 3];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="${fill}"/><circle cx="100" cy="170" r="${40 + (n % 4) * 8}" fill="#222"/><rect width="200" height="58" fill="#fafafa"/><text x="100" y="38" font-family="Arial, sans-serif" font-weight="700" font-size="${Math.min(20, Math.floor(240 / title.length))}" fill="#222" text-anchor="middle">${title.toUpperCase()}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const items = [
  { series: "Moonlit Ronin", chapter: 12, chapterTitle: "The last ferry", page: 5, pages: 24 },
  { series: "Kitchen Spirits", chapter: 31, chapterTitle: "Midnight broth", page: 18, pages: 20 },
].map((item) => ({
  ...item,
  cover: { src: cover(item.series, item.chapter), alt: "" },
  href: `#${item.series.toLowerCase().replaceAll(" ", "-")}-${item.chapter}`,
}));

const volumes = ["Moonlit Ronin", "Kitchen Spirits", "Starboard Academy"].map((title, i) => ({
  number: i + 2,
  title,
  cover: {
    src: cover(title, i + 2),
    alt: `${title}, volume ${i + 2}: a black circle on grey tone`,
  },
  href: `#volume-${i + 2}`,
}));

// The page's parts on their own; /view/library-page is the whole page in its app shell.
export default function LibraryPageDefaultDemo() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-10">
      <ContinueReading items={items} />
      <Shelf title="Reading" volumes={volumes} count={volumes.length} />
    </div>
  );
}
