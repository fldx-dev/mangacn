import { cn } from "cn";
import * as React from "react";
import { MangaFrame } from "@/components/manga-frame";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";

/** A chapter the reader has open: where they stopped, and where to pick it up. */
export interface ReadingProgress {
  /** The series' title. */
  series: string;
  /** The chapter's number. */
  chapter: number;
  /** The chapter's title, shown after its number. */
  chapterTitle?: string;
  /** The page the reader stopped on, from 1. */
  page: number;
  /** The chapter's page count. */
  pages: number;
  /** The series' cover, shown small beside the text. */
  cover: { src: string; alt: string };
  /** Where "Resume" goes: the chapter, open at the page. */
  href: string;
}

export interface ContinueReadingProps extends Omit<React.ComponentProps<"section">, "children"> {
  /** The open chapters, most recent first; two to four read best. */
  items: ReadingProgress[];
  /**
   * The section's heading.
   * @default "Continue reading"
   */
  title?: string;
}

/** "Chapter 12, page 5 of 24": the progress bar's value in words. */
export function progressText({ chapter, page, pages }: ReadingProgress): string {
  return `Chapter ${chapter}, page ${page} of ${pages}`;
}

/**
 * The chapters a reader has open, as cards: a small cover in a manga-frame, the series and
 * chapter, a progress bar that says its value in words, and a link back to the page. A section
 * named by its heading; the cards stack on phones. A server component with no state: it renders
 * what it is given and draws nothing of its own.
 */
export function ContinueReading({
  items,
  title = "Continue reading",
  className,
  ...props
}: ContinueReadingProps) {
  const headingId = React.useId();
  return (
    <section
      data-slot="continue-reading"
      aria-labelledby={headingId}
      className={cn("@container flex flex-col gap-4", className)}
      {...props}
    >
      <h2 id={headingId} className="font-display text-xl leading-tight uppercase">
        {title}
      </h2>
      <ul className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.href} className="min-w-0">
            <Card size="sm" className="h-full">
              <div className="flex gap-3 px-(--card-spacing)">
                <MangaFrame
                  src={item.cover.src}
                  alt={item.cover.alt}
                  aspect="3/4"
                  decoding="async"
                  className="w-16 shrink-0"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-display text-base leading-tight wrap-break-word">
                      {item.series}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Chapter {item.chapter}
                      {item.chapterTitle && `: ${item.chapterTitle}`}
                    </p>
                  </div>
                  {/* The bar's value in words: "Chapter 12, page 5 of 24", not "21%". */}
                  <Progress
                    value={item.page}
                    min={0}
                    max={item.pages}
                    aria-valuetext={progressText(item)}
                    className="gap-1.5"
                  >
                    <ProgressLabel className="text-xs font-normal text-muted-foreground tabular-nums">
                      Page {item.page} of {item.pages}
                    </ProgressLabel>
                  </Progress>
                  {/* A link drawn as a button: Base UI marks a non-native button role="button". */}
                  <Button
                    nativeButton={false}
                    role="link"
                    render={<a href={item.href} />}
                    size="sm"
                    className="self-start"
                  >
                    Resume <span className="sr-only">{item.series}</span>
                  </Button>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
