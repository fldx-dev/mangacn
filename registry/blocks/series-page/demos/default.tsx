import { SeriesHeader } from "@/registry/blocks/series-page/components/series-header";

// The page's header on its own; /view/series-page is the whole page with its tabs. The cover is
// inline SVG so the demo needs no files.
const coverSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="#ededed"/><circle cx="100" cy="170" r="40" fill="#222"/><rect x="0" y="0" width="200" height="58" fill="#fafafa"/><text x="100" y="38" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#222" text-anchor="middle">LANTERN</text></svg>`;

export default function SeriesPageDefaultDemo() {
  return (
    <SeriesHeader
      className="w-full max-w-4xl"
      series={{
        title: "Lantern Keepers",
        originalTitle: "灯守り",
        reading: "ひもり",
        author: "Hana Mori",
        artist: "Kei Arata",
        synopsis:
          "Every night the harbour town of Shiogama lights a thousand paper lanterns so the dead can find their way home. When they start going out, apprentice keeper Mio Amano follows the dark down to the old ferry.",
        status: "ongoing",
        cover: {
          src: `data:image/svg+xml,${encodeURIComponent(coverSvg)}`,
          alt: "Lantern Keepers cover: a black lantern on grey tone under the title",
        },
        startHref: "#chapter-1",
      }}
    />
  );
}
