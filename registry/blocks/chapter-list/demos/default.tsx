import { ChapterList } from "@/registry/blocks/chapter-list/chapter-list";

const chapters = [
  { number: 1, title: "The Ink Well", href: "#chapter-1", date: "2026-10-05", read: true },
  { number: 2, title: "Screentone Sky", href: "#chapter-2", date: "2026-10-12", read: true },
  { number: 3, title: "A Panel Too Far", href: "#chapter-3", date: "2026-10-19" },
  { number: 4, title: "Bleed to the Edge", href: "#chapter-4", date: "2026-10-26" },
  { number: 5, title: "Final Page Turn", href: "#chapter-5", date: "2026-11-02" },
];

export default function ChapterListDefaultDemo() {
  return <ChapterList chapters={chapters} label="Ink Well chapters" />;
}
