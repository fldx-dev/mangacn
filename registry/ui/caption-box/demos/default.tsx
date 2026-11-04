import { CaptionBox } from "@/registry/ui/caption-box/caption-box";

export default function CaptionBoxDefaultDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col items-start gap-4">
      <CaptionBox>Meanwhile, on the other side of the city…</CaptionBox>
      <CaptionBox lang="ja" className="self-end">
        その頃、街の反対側では……
      </CaptionBox>
    </div>
  );
}
