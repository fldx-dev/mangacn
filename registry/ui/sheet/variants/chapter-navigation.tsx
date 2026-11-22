"use client";

import { useRef } from "react";
import { Button } from "@/registry/ui/button/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/ui/sheet/sheet";

const chapters = [
  "The Move",
  "New School",
  "First Race",
  "Paper Moon",
  "Station Roof",
  "Night Shift",
  "Rain Check",
  "Rooftop",
  "Last Train",
  "Skyline",
  "Finish Line",
  "Morning",
];

const current = 8;

export default function SheetChapterNavigationVariant() {
  // Open on the chapter being read rather than the first link.
  const currentRef = useRef<HTMLAnchorElement>(null);
  return (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>Chapters</SheetTrigger>
      <SheetContent side="left" initialFocus={currentRef}>
        <SheetHeader>
          <SheetTitle>Rooftop Runners</SheetTitle>
          <SheetDescription>Volume 2 · reading chapter {current}.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Chapters" className="min-h-0 flex-1 overflow-y-auto px-2 pt-1 pb-4">
          <ol className="grid gap-0.5">
            {chapters.map((title, index) => {
              const n = index + 1;
              return (
                <li key={title}>
                  <a
                    ref={n === current ? currentRef : undefined}
                    href={`#chapter-${n}`}
                    aria-current={n === current ? "page" : undefined}
                    className="flex gap-3 rounded-md px-2 py-1.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted aria-[current=page]:font-medium"
                  >
                    <span className="w-5 text-right text-muted-foreground tabular-nums">{n}</span>
                    {title}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
