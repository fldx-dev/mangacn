import { cn } from "cn";
import type * as React from "react";
import { MangaFrame } from "@/components/manga-frame";
import { PageNumber } from "@/components/page-number";
import { PanelGrid, type PanelGridColumns, PanelGridItem } from "@/components/panel-grid";
import { Stamp } from "@/components/stamp";
import { AspectRatio } from "@/components/ui/aspect-ratio";

/** A volume's cover picture. */
export interface VolumeCover {
  /** The cover's URL, passed to a plain `<img>`. Portrait covers fill best (the frame is 2:3). */
  src: string;
  /** What the cover shows, for readers who cannot see it. */
  alt: string;
}

/** One volume of the series. */
export interface Volume {
  /** The volume's number, shown as its folio and in its name ("Volume 3", 第3巻). */
  number: number;
  /** The volume's title. */
  title: string;
  /** The cover, in a 2:3 manga-frame. */
  cover: VolumeCover;
  /** Where the volume's page is; the cover, number and title are one link to it. */
  href: string;
  /** When it came out, printed as given ("2026/10/05", "Oct 2026"). */
  date?: string;
  /** Stamps the cover NEW (最新 with `numerals="ja"`). */
  isNew?: boolean;
}

/** `latin` names a volume "Volume 3"; `ja` names it 第3巻 under `lang="ja"`. */
export type VolumeNumerals = "latin" | "ja";

export interface VolumeGridProps extends Omit<React.ComponentProps<"nav">, "children"> {
  /** The volumes, in the order to show them. */
  volumes: Volume[];
  /**
   * Covers per row: a count from `sm` up (one on phones), or one per breakpoint, as
   * panel-grid takes it. Covers past the widest row's count load lazily.
   * @default { base: 2, sm: 3, md: 4 }
   */
  columns?: PanelGridColumns;
  /**
   * `latin` names each volume "Volume 3"; `ja` writes 第3巻 under `lang="ja"`, with the stamp in
   * Japanese too.
   * @default "latin"
   */
  numerals?: VolumeNumerals;
  /**
   * The navigation landmark's name, which tells it apart from the page's other navs.
   * @default "Volumes"
   */
  label?: string;
  /**
   * How many covers load at once; the rest load lazily. Pass `0` for a grid below the page's
   * first screen, such as a shelf further down a library page.
   * @default the widest row's count
   */
  eager?: number;
}

const DEFAULT_COLUMNS: PanelGridColumns = { base: 2, sm: 3, md: 4 };

/** "Volume 3", or 第3巻. */
export function volumeLabel(number: number, numerals: VolumeNumerals = "latin"): string {
  return numerals === "ja" ? `第${number}巻` : `Volume ${number}`;
}

/** The widest row's cover count: the covers above it load at once, the rest lazily. */
export function firstRowSize(columns: PanelGridColumns): number {
  if (typeof columns === "number") return columns;
  return Math.max(1, ...Object.values(columns).filter((n) => typeof n === "number"));
}

/**
 * A series' volumes as covers: a named `<nav>` around a list laid out by panel-grid, each
 * volume one link (its cover in a 2:3 manga-frame, its number as a folio, its title and date)
 * named by what it shows, the new ones stamped. Covers past the first row load lazily.
 * A server component; it composes panel-grid, aspect-ratio, manga-frame, page-number and stamp
 * and draws nothing of its own.
 */
export function VolumeGrid({
  volumes,
  columns = DEFAULT_COLUMNS,
  numerals = "latin",
  label = "Volumes",
  eager = firstRowSize(columns),
  className,
  ...props
}: VolumeGridProps) {
  const lang = numerals === "ja" ? "ja" : undefined;

  return (
    <nav
      data-slot="volume-grid"
      aria-label={label}
      className={cn("w-full max-w-4xl text-ink", className)}
      {...props}
    >
      {/* panel-grid lays the covers out (it renders divs); the list roles keep it a list. */}
      <PanelGrid role="list" columns={columns} gutter="lg">
        {volumes.map((volume, index) => {
          return (
            <PanelGridItem
              role="listitem"
              key={`${volume.number}-${volume.href}`}
              data-slot="volume-grid-volume"
              data-new={volume.isNew ? "true" : undefined}
            >
              <a
                href={volume.href}
                // Named by its content, cover first: a name written apart from the text shown
                // (`aria-labelledby` over part of it) fails WCAG 2.5.3 Label in Name.
                className="group @container flex min-w-0 flex-col gap-2 rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <div className="relative">
                  <AspectRatio ratio={2 / 3}>
                    {/* The frame fills the 2:3 box: the figure, its frame box, the picture. */}
                    <MangaFrame
                      src={volume.cover.src}
                      alt={volume.cover.alt}
                      loading={index < eager ? undefined : "lazy"}
                      decoding="async"
                      style={{ height: "100%" }}
                      className="absolute inset-0 *:h-full"
                    />
                  </AspectRatio>
                  {volume.isNew && (
                    <Stamp size="sm" rotate={10} lang={lang} className="absolute -top-3 -right-3">
                      {numerals === "ja" ? "最新" : "NEW"}
                    </Stamp>
                  )}
                </div>
                {/* The text sits beside the folio, or under it on a cover narrower than both. */}
                <div className="flex min-w-0 flex-wrap items-start gap-x-2 gap-y-1">
                  {/* The folio is the number for the eye; the name below says it in words. */}
                  <PageNumber
                    page={volume.number}
                    side="left"
                    aria-hidden
                    className="[&_[data-slot=page-number-page]]:text-2xl"
                  />
                  {/* Blocks, not spans: each line is then its own word group in the link's name. */}
                  <div className="flex min-w-0 grow basis-24 flex-col gap-0.5">
                    <div lang={lang} className="text-xs text-muted-foreground">
                      {volumeLabel(volume.number, numerals)}
                    </div>
                    <div className="font-display text-sm leading-tight wrap-break-word group-hover:text-spot @max-[7rem]:text-xs @[9rem]:text-base">
                      {volume.title}
                    </div>
                    {volume.date && (
                      <div className="text-xs text-muted-foreground">{volume.date}</div>
                    )}
                  </div>
                </div>
              </a>
            </PanelGridItem>
          );
        })}
      </PanelGrid>
    </nav>
  );
}
