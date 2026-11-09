import { InkFrame } from "@/components/ink-frame";
import { AspectRatio } from "@/registry/ui/aspect-ratio/aspect-ratio";

export default function AspectRatioDefaultDemo() {
  return (
    <div className="w-full max-w-sm">
      <AspectRatio ratio={16 / 9}>
        <InkFrame
          fill="tone"
          className="flex size-full items-center justify-center rounded-lg font-display text-2xl text-ink"
        >
          16 : 9
        </InkFrame>
      </AspectRatio>
    </div>
  );
}
