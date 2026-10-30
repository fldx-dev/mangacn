import { SfxText } from "@/registry/ui/sfx-text/sfx-text";

export default function SfxTextSizesDemo() {
  return (
    <div className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-6">
      <SfxText size="sm">Pon</SfxText>
      <SfxText size="md" rotate={4}>
        Gatan
      </SfxText>
      <SfxText size="lg" rotate={-3}>
        Zudon
      </SfxText>
      <SfxText size="xl" rotate={-8}>
        Baan!
      </SfxText>
    </div>
  );
}
