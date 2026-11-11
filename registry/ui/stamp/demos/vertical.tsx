import { Stamp } from "@/registry/ui/stamp/stamp";

export default function StampVerticalDemo() {
  return (
    // Two kanji cut top to bottom, as a hanko is: the column fills the seal at every size.
    <div lang="ja" className="flex flex-wrap items-center justify-center gap-6">
      <Stamp vertical size="sm">
        最新
      </Stamp>
      <Stamp vertical>完結</Stamp>
      <Stamp vertical shape="square" rotate={4}>
        検印
      </Stamp>
      <Stamp vertical size="lg" color="ink" rotate={-12}>
        極秘
      </Stamp>
    </div>
  );
}
