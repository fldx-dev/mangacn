import { ChapterList } from "@/registry/blocks/chapter-list/chapter-list";

// Reading order, part way through: the read chapters struck through in tone, the next one
// outlined, the omake (not a numbered chapter) last and never stamped.
const chapters = [
  { number: 1, title: "The Ink Well", href: "#chapter-1", read: true },
  { number: 2, title: "Screentone Sky", href: "#chapter-2", read: true },
  { number: "2.5", title: "Interlude: Gutter Talk", href: "#chapter-2-5", read: true },
  { number: 3, title: "A Panel Too Far", href: "#chapter-3" },
  { number: 4, title: "Bleed to the Edge", href: "#chapter-4" },
  { number: "Extra", title: "Omake: Desk Tour", href: "#extra" },
];

export default function ChapterListReadStatesDemo() {
  return <ChapterList chapters={chapters} order="asc" label="Ink Well chapters, reading order" />;
}
