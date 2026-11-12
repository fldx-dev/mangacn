import { AppSidebar } from "@/components/app-sidebar";
import type { Volume } from "@/components/blocks/volume-grid/volume-grid";
import { ContinueReading, type ReadingProgress } from "@/components/continue-reading";
import { Shelf, type ShelfEmpty } from "@/components/shelf";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// A reader's shelf inside sidebar-07's app shell: the chapters they have open, then their shelves
// of volumes. Everything on the page comes from `library` below; replace it with your fetch
// (`const library = await getLibrary()` in this async page) and nothing else changes.

interface Library {
  /** The chapters the reader has open, most recent first. */
  continueReading: ReadingProgress[];
  /** The reader's shelves, in order; a shelf with no volumes shows its `empty`. */
  shelves: { title: string; volumes: Volume[]; empty?: ShelfEmpty }[];
}

// Covers as inline SVG, so the page needs no files: a title band over a grey tone and a shape
// that changes per cover. Any image URLs work.
function cover(title: string, n: number): string {
  const fill = ["#ededed", "#d6d6d6", "#bdbdbd"][n % 3];
  const shape =
    n % 2 === 0
      ? `<circle cx="100" cy="170" r="${40 + (n % 4) * 8}" fill="#222"/>`
      : `<rect x="50" y="${110 + (n % 3) * 10}" width="100" height="110" fill="#222" transform="rotate(${n * 7} 100 170)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="${fill}"/>${shape}<rect width="200" height="58" fill="#fafafa"/><text x="100" y="38" font-family="Arial, sans-serif" font-weight="700" font-size="${Math.min(20, Math.floor(240 / title.length))}" fill="#222" text-anchor="middle">${title.toUpperCase()}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const shape = (n: number) => (n % 2 === 0 ? "a black circle" : "a tilted black square");

function volume(series: string, number: number, extra: Partial<Volume> = {}): Volume {
  const slug = series.toLowerCase().replaceAll(" ", "-");
  return {
    number,
    title: series,
    cover: {
      src: cover(series, number),
      alt: `${series}, volume ${number}: ${shape(number)} on grey tone`,
    },
    href: `#${slug}-volume-${number}`,
    ...extra,
  };
}

function reading(
  series: string,
  chapter: number,
  chapterTitle: string,
  page: number,
  pages: number,
): ReadingProgress {
  const slug = series.toLowerCase().replaceAll(" ", "-");
  return {
    series,
    chapter,
    chapterTitle,
    page,
    pages,
    cover: { src: cover(series, chapter), alt: "" },
    href: `#${slug}-chapter-${chapter}-page-${page}`,
  };
}

// This is sample data.
const library: Library = {
  continueReading: [
    reading("Moonlit Ronin", 12, "The last ferry", 5, 24),
    reading("Kitchen Spirits", 31, "Midnight broth", 18, 20),
    reading("Starboard Academy", 4, "Signal flags", 2, 32),
  ],
  shelves: [
    {
      title: "Reading",
      volumes: [
        volume("Moonlit Ronin", 3, { date: "Oct 2026", isNew: true }),
        volume("Kitchen Spirits", 6, { date: "Aug 2026" }),
        volume("Starboard Academy", 1, { date: "Sep 2026" }),
        volume("Paper Lanterns", 2, { date: "Mar 2026" }),
      ],
    },
    {
      title: "Finished",
      volumes: [
        volume("Night Market", 5, { date: "Jan 2026" }),
        volume("Gutter Talk", 3, { date: "Nov 2025" }),
        volume("The Ink Well", 8, { date: "Jul 2025" }),
        volume("Tide Clock", 2, { date: "Apr 2025" }),
        volume("The Last Panel", 4, { date: "Dec 2024" }),
      ],
    },
    {
      title: "Wishlist",
      volumes: [],
      empty: {
        description: "Volumes you want to read next wait here.",
        action: { label: "Browse series", href: "#browse" },
      },
    },
  ],
};

/** Covers in volume-grid's widest row: the first shelf loads that many at once. */
const FIRST_ROW = 4;

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Hana Mori</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Library</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-10 p-4 pt-0 pb-10">
          <h1 className="font-display text-2xl leading-tight uppercase">Library</h1>
          <ContinueReading items={library.continueReading} />
          {library.shelves.map((shelf, index) => (
            <Shelf
              key={shelf.title}
              title={shelf.title}
              volumes={shelf.volumes}
              count={shelf.volumes.length > 0 ? shelf.volumes.length : undefined}
              empty={shelf.empty}
              // The first shelf's first row is on a phone's first screen, and one of its
              // covers is the page's largest paint: a lazy image there paints seconds late.
              eager={index === 0 ? FIRST_ROW : 0}
            />
          ))}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
