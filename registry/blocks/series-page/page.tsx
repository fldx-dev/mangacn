import { ChapterList } from "@/components/blocks/chapter-list/chapter-list";
import { CharacterCard } from "@/components/blocks/character-card/character-card";
import { VolumeGrid } from "@/components/blocks/volume-grid/volume-grid";
import { type Series, SeriesHeader } from "@/components/series-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// A manga series' home page: the header, then its volumes, chapters and cast in tabs. Replace
// `series` with your fetch (`const series = await getSeries(slug)`) and nothing else changes.
// Covers and portraits are inline SVG so the page needs no files; any image URLs work.
const series: Series = {
  title: "Lantern Keepers",
  originalTitle: "灯守り",
  reading: "ひもり",
  author: "Hana Mori",
  artist: "Kei Arata",
  synopsis:
    "Every night the harbour town of Shiogama lights a thousand paper lanterns so the dead can find their way home. When the lanterns start going out one by one, apprentice keeper Mio Amano follows the dark down to the old ferry, and finds someone waiting on the other side.",
  status: "ongoing",
  cover: {
    src: cover(0, "LANTERN"),
    alt: "Lantern Keepers cover: a black lantern on grey tone under the title",
  },
  startHref: "#chapter-1",
  volumes: [
    ["The First Light", "Jan 2026"],
    ["Paper and Flame", "Apr 2026"],
    ["The Night Market", "Jul 2026"],
    ["Low Tide", "Sep 2026"],
    ["The Last Ferry", "Nov 2026"],
  ].map(([title, date], i) => ({
    number: i + 1,
    title,
    cover: {
      src: cover(i + 1, "LANTERN"),
      alt: `Volume ${i + 1} cover: a black shape on grey tone`,
    },
    href: `#volume-${i + 1}`,
    date,
    isNew: i === 4,
  })),
  chapters: [
    "A Thousand Lanterns",
    "The Keeper's Oath",
    "Wick and Oil",
    "Shadows on the Pier",
    "The Ferryman's Bell",
    "What the Tide Brings",
    "Lanterns Going Out",
    "The Other Shore",
  ].map((title, i) => ({
    number: i + 1,
    title,
    href: `#chapter-${i + 1}`,
    date: `2026-${String(9 + Math.floor(i / 4)).padStart(2, "0")}-${String(3 + (i % 4) * 7).padStart(2, "0")}`,
    read: i < 3,
  })),
  // Linked cards take no `reading`: character-card names its link by the name alone, so ruby
  // inside the link would read differently from its name (WCAG 2.5.3, axe
  // label-content-name-mismatch).
  cast: [
    {
      name: "Mio Amano",
      castRole: "Lead · Apprentice keeper",
      portrait: {
        src: portrait("M78 190 C70 100 230 100 222 190 C200 150 110 140 78 190 Z", "#d6d6d6"),
        alt: "Mio Amano, short dark hair, smiling under a pale moon",
      },
      quote: "The lanterns are lit. Nobody gets lost tonight.",
      status: "MAIN",
      href: "#mio-amano",
    },
    {
      name: "Ren Kuroda",
      castRole: "Rival · Ferryman's son",
      portrait: {
        src: portrait(
          "M74 200 L90 110 L120 140 L150 96 L180 140 L210 110 L226 200 C200 160 100 160 74 200 Z",
          "#ededed",
        ),
        alt: "Ren Kuroda, spiky black hair",
      },
      quote: "The ferry only runs one way.",
      href: "#ren-kuroda",
    },
    {
      name: "Old Tomo",
      castRole: "Mentor · Head keeper",
      portrait: {
        src: portrait("M90 160 C110 130 190 130 210 160 C190 150 110 150 90 160 Z", "#bdbdbd"),
        alt: "Old Tomo, nearly bald, a thin fringe of hair",
      },
      href: "#old-tomo",
    },
  ],
};

export default function Page() {
  const { volumes, chapters, cast, ...info } = series;
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 md:px-8 md:py-12">
      <SeriesHeader series={info} />
      {/* Each panel is named by its tab; only the open panel is rendered, so the other tabs'
          pictures load when their tab opens. */}
      <Tabs defaultValue="volumes" className="gap-6">
        <TabsList>
          <TabsTrigger value="volumes">Volumes</TabsTrigger>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
          <TabsTrigger value="cast">Cast</TabsTrigger>
        </TabsList>
        <TabsContent value="volumes" className="flex flex-col gap-4">
          <h2 className="font-display text-xl">{`${volumes.length} volumes`}</h2>
          <VolumeGrid volumes={volumes} label={`${series.title} volumes`} />
        </TabsContent>
        <TabsContent value="chapters" className="flex flex-col gap-4">
          <h2 className="font-display text-xl">{`${chapters.length} chapters`}</h2>
          <ChapterList chapters={chapters} label={`${series.title} chapters`} />
        </TabsContent>
        <TabsContent value="cast" className="flex flex-col gap-4">
          <h2 className="font-display text-xl">{`${cast.length} characters`}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cast.map((member) => (
              <li key={member.name} className="flex">
                <CharacterCard {...member} />
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </main>
  );
}

// A cover: a title band over a screentone field and a shape that changes per volume.
function cover(n: number, title: string): string {
  const fill = ["#ededed", "#d6d6d6", "#bdbdbd"][n % 3];
  const shape =
    n % 2 === 0
      ? `<circle cx="100" cy="170" r="${40 + (n % 4) * 8}" fill="#222"/>`
      : `<rect x="50" y="${110 + (n % 3) * 10}" width="100" height="110" fill="#222" transform="rotate(${n * 7} 100 170)"/>`;
  const folio =
    n > 0
      ? `<text x="178" y="285" font-family="Arial, sans-serif" font-weight="700" font-size="28" fill="#fafafa" text-anchor="end">${n}</text>`
      : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="${fill}"/>${shape}<rect x="0" y="0" width="200" height="58" fill="#fafafa"/><text x="100" y="38" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#222" text-anchor="middle">${title}</text>${folio}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// A portrait: a bust in ink on a screentone sky.
function portrait(hair: string, sky: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="${sky}"/><circle cx="240" cy="70" r="26" fill="#fafafa" stroke="#222" stroke-width="4"/><path d="M40 400 C40 300 90 270 150 270 C210 270 260 300 260 400 Z" fill="#fafafa" stroke="#222" stroke-width="6"/><circle cx="150" cy="190" r="72" fill="#fafafa" stroke="#222" stroke-width="6"/><path d="${hair}" fill="#222"/><circle cx="125" cy="200" r="7" fill="#222"/><circle cx="175" cy="200" r="7" fill="#222"/><path d="M135 238 Q150 248 165 238" fill="none" stroke="#222" stroke-width="5" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
