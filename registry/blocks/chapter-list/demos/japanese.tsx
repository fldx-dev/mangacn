import { ChapterList } from "@/registry/blocks/chapter-list/chapter-list";

const chapters = [
  { number: 10, title: "墨の井戸", href: "#chapter-10", date: "2026/10/05", read: true },
  { number: 11, title: "網点の空", href: "#chapter-11", date: "2026/10/12", read: true },
  { number: 12, title: "コマの向こう", href: "#chapter-12", date: "2026/10/19" },
  { number: 13, title: "裁ち落とし", href: "#chapter-13", date: "2026/10/26" },
];

export default function ChapterListJapaneseDemo() {
  // lang on the nav covers the titles; the block sets it on the numerals, stamp and states.
  return <ChapterList chapters={chapters} numerals="ja" label="話一覧" lang="ja" />;
}
