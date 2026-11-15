"use client";

import { cn } from "cn";
import { useEffect, useState } from "react";

export interface Piece {
  id: string;
  en: string;
  /** The manga term, for the pieces the form itself names. */
  ja?: string;
}

/**
 * The bento's index: the kinds of piece on the sheet, the one in the middle of the screen
 * marked in ink. Each panel carries `data-piece` with its id; an IntersectionObserver (no
 * scroll listener) reports which one crosses the middle band of the viewport.
 */
export function PieceIndex({ pieces }: { pieces: Piece[] }) {
  const [active, setActive] = useState<string | undefined>(pieces[0]?.id);
  useEffect(() => {
    // Without the observer the first piece stays marked; the index still reads as a list.
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive((entry.target as HTMLElement).dataset.piece);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const node of document.querySelectorAll("[data-piece]")) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <ol className="flex flex-wrap gap-x-5 gap-y-2 lg:flex-col lg:gap-1">
      {pieces.map((piece) => {
        const on = piece.id === active;
        return (
          <li
            key={piece.id}
            data-active={on || undefined}
            className={cn(
              "flex items-baseline gap-2 transition-colors duration-300 motion-reduce:transition-none",
              on ? "text-ink" : "text-tone-4",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "hidden h-0.5 w-6 origin-left self-center bg-ink transition-[scale] duration-300 ease-(--landing-ease) lg:block motion-reduce:transition-none",
                on ? "scale-x-100" : "scale-x-0",
              )}
            />
            <span className="font-display text-base lg:text-xl">{piece.en}</span>
            {piece.ja ? (
              <span lang="ja" className="text-sm text-tone-4">
                {piece.ja}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
