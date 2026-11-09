import { Stamp } from "@/registry/ui/stamp/stamp";

export default function StampLongWordsDemo() {
  return (
    // Longer words shrink to fit inside the inner ring; at `lg` about 8 Latin letters or 4 kanji
    // stay readable, and two words wrap onto two lines.
    <div className="flex flex-wrap items-center justify-center gap-6">
      <Stamp size="lg">SUPER</Stamp>
      <Stamp size="lg" shape="square" color="ink" rotate={5}>
        APPROVED
      </Stamp>
      <Stamp size="lg" rotate={-4}>
        TOP SECRET
      </Stamp>
      <Stamp lang="ja" size="lg" shape="square" rotate={8}>
        週刊連載
      </Stamp>
    </div>
  );
}
