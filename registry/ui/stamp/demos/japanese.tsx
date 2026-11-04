import { Stamp } from "@/registry/ui/stamp/stamp";

export default function StampJapaneseDemo() {
  return (
    // Kanji in the heavy display face need the large seal to stay legible.
    <div lang="ja" className="flex flex-wrap items-center justify-center gap-6">
      <Stamp size="lg">完結</Stamp>
      <Stamp shape="square" size="lg" rotate={5}>
        検印
      </Stamp>
      <Stamp color="ink" rotate={-14}>
        済
      </Stamp>
    </div>
  );
}
