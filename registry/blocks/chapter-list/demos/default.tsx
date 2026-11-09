import { ChapterList } from "@/registry/blocks/chapter-list/chapter-list";

const chapters = [
  { number: 1, title: "The Ink Well", href: "#chapter-1", date: "2026-09-14", read: true },
  { number: 2, title: "Screentone Sky", href: "#chapter-2", date: "2026-09-21", read: true },
  { number: 3, title: "A Panel Too Far", href: "#chapter-3", date: "2026-09-28" },
  { number: 4, title: "Speed Lines", href: "#chapter-4", date: "2026-10-05" },
  { number: 5, title: "The Spot Red Seal", href: "#chapter-5", date: "2026-10-12" },
  { number: 6, title: "Gutter Talk", href: "#chapter-6", date: "2026-10-19" },
  { number: 7, title: "Bleed to the Edge", href: "#chapter-7", date: "2026-10-26" },
  { number: 8, title: "Final Page Turn", href: "#chapter-8", date: "2026-11-02" },
];

export default function ChapterListDefaultDemo() {
  return <ChapterList chapters={chapters} label="Ink Well chapters" />;
}
