import { SfxText } from "@/registry/ui/sfx-text/sfx-text";

export default function SfxTextColorsDemo() {
  return (
    <div className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-6">
      <SfxText color="paper">Bakyun</SfxText>
      <SfxText color="ink" rotate={3}>
        Goro goro
      </SfxText>
      <SfxText color="spot" rotate={-10} enter="pop">
        Don!
      </SfxText>
      <SfxText color="ink" stroke={false} rotate={0}>
        No stroke
      </SfxText>
      <SfxText lang="ja" size="lg" rotate={-4}>
        ドカン
      </SfxText>
    </div>
  );
}
