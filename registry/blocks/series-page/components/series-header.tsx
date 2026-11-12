"use client";

import { cn } from "cn";
import type * as React from "react";
import { useState } from "react";
import type { Chapter } from "@/components/blocks/chapter-list/chapter-list";
import type { CharacterCardProps } from "@/components/blocks/character-card/character-card";
import type { Volume } from "@/components/blocks/volume-grid/volume-grid";
import { MangaFrame } from "@/components/manga-frame";
import { Stamp } from "@/components/stamp";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";

/** Where the series stands: stamped on the cover in Japanese, said in English. */
export type SeriesStatus = "ongoing" | "completed" | "hiatus";

/** The stamp's word for each status (under `lang="ja"`) and what it says to assistive tech. */
export const SERIES_STATUS: Record<SeriesStatus, { stamp: string; label: string }> = {
  ongoing: { stamp: "連載中", label: "Ongoing" },
  completed: { stamp: "完結", label: "Completed" },
  hiatus: { stamp: "休載", label: "On hiatus" },
};

/** One member of the cast, as character-card takes it. */
export type SeriesCastMember = Pick<
  CharacterCardProps,
  "name" | "reading" | "castRole" | "portrait" | "quote" | "stats" | "status" | "href"
>;

/** A manga series: what the page shows, in the shape a fetch would return it. */
export interface Series {
  /** The series' title: the page's one `h1`. */
  title: string;
  /** The title in its original language (灯守り), shown under the `h1` with `titleLang`. */
  originalTitle?: string;
  /**
   * The language of `originalTitle`.
   * @default "ja"
   */
  titleLang?: string;
  /** How the original title is read (ひもり), set as ruby over it. */
  reading?: string;
  /** Who writes it. */
  author: string;
  /** Who draws it, when that is someone else. */
  artist?: string;
  /** A few sentences about the story. */
  synopsis: string;
  /** Stamped on the cover. */
  status?: SeriesStatus;
  /** The series' cover, in a 2:3 manga-frame. */
  cover: { src: string; alt: string };
  /** Where "Start reading" goes: the first chapter's reader page. */
  startHref: string;
  /** The Volumes tab, as volume-grid takes them. */
  volumes: Volume[];
  /** The Chapters tab, as chapter-list takes them. */
  chapters: Chapter[];
  /** The Cast tab, one character-card each. */
  cast: SeriesCastMember[];
}

/** The fields the header shows. */
export type SeriesInfo = Omit<Series, "volumes" | "chapters" | "cast">;

export interface SeriesHeaderProps extends Omit<React.ComponentProps<"header">, "children"> {
  /** The series: title, credits, synopsis, status, cover and where reading starts. */
  series: SeriesInfo;
  /** Whether the reader follows the series; pass it with `onFollowingChange` to control it. */
  following?: boolean;
  /**
   * Whether the reader follows the series at first, when the header keeps it.
   * @default false
   */
  defaultFollowing?: boolean;
  /** Called with the new state when Follow is pressed. */
  onFollowingChange?: (following: boolean) => void;
}

/**
 * A series' header: the cover in a 2:3 manga-frame with the status stamped on it, the title as
 * the page's `h1` with the original title and its reading as ruby, the credits, the synopsis,
 * and two buttons: "Start reading" (a link) and "Follow" (a toggle, `aria-pressed`). The cover
 * stacks above the text on phones and sits beside it from `md`. A client component (Follow
 * keeps its state); it composes manga-frame, aspect-ratio, stamp and button and draws nothing
 * of its own.
 */
export function SeriesHeader({
  series,
  following: followingProp,
  defaultFollowing = false,
  onFollowingChange,
  className,
  ...props
}: SeriesHeaderProps) {
  const [ownFollowing, setOwnFollowing] = useState(defaultFollowing);
  const following = followingProp ?? ownFollowing;
  const status = series.status ? SERIES_STATUS[series.status] : undefined;
  const titleLang = series.titleLang ?? "ja";

  const toggleFollowing = () => {
    const next = !following;
    if (followingProp === undefined) setOwnFollowing(next);
    onFollowingChange?.(next);
  };

  return (
    <header
      data-slot="series-header"
      className={cn(
        "grid gap-6 text-ink md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:items-start md:gap-10",
        className,
      )}
      {...props}
    >
      <div data-slot="series-header-cover" className="relative w-40 sm:w-48 md:w-full">
        <AspectRatio ratio={2 / 3}>
          {/* The frame fills the 2:3 box, as volume-grid's covers do. The cover is the first
              screen's picture, so it loads at once. */}
          <MangaFrame
            src={series.cover.src}
            alt={series.cover.alt}
            fetchPriority="high"
            decoding="async"
            style={{ height: "100%" }}
            className="absolute inset-0 *:h-full"
          />
        </AspectRatio>
        {status && (
          <Stamp
            lang="ja"
            vertical
            rotate={8}
            aria-label={status.label}
            className="absolute -top-4 -right-4"
          >
            {status.stamp}
          </Stamp>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl leading-tight wrap-break-word uppercase md:text-5xl">
            {series.title}
          </h1>
          {series.originalTitle && (
            <p lang={titleLang} className="text-lg">
              {series.reading ? (
                <ruby>
                  {series.originalTitle}
                  <rp>(</rp>
                  <rt className="text-xs tracking-wide text-muted-foreground">{series.reading}</rt>
                  <rp>)</rp>
                </ruby>
              ) : (
                series.originalTitle
              )}
            </p>
          )}
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">{series.artist ? "Story" : "By"}</dt>
            <dd>{series.author}</dd>
          </div>
          {series.artist && (
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Art</dt>
              <dd>{series.artist}</dd>
            </div>
          )}
        </dl>
        <p className="max-w-prose text-base leading-relaxed">{series.synopsis}</p>
        <div className="flex flex-wrap gap-3">
          {/* An anchor drawn as a button: Base UI marks it role="button", so role="link". */}
          <Button size="lg" nativeButton={false} role="link" render={<a href={series.startHref} />}>
            Start reading
          </Button>
          {/* The name stays "Follow"; the pressed state says whether the reader follows. */}
          <Button
            size="lg"
            variant={following ? "secondary" : "outline"}
            aria-pressed={following}
            onClick={toggleFollowing}
          >
            Follow
          </Button>
        </div>
      </div>
    </header>
  );
}
