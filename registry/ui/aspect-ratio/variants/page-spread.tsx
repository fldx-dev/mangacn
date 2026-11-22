import { InkFrame } from "@/components/ink-frame";
import { AspectRatio } from "@/registry/ui/aspect-ratio/aspect-ratio";

export default function AspectRatioPageSpreadVariant() {
  return (
    <figure className="grid w-full max-w-xl gap-2">
      {/* Two B5 pages side by side (182 by 257 mm each); page 6 sits on the right, read first. */}
      <AspectRatio ratio={(2 * 182) / 257}>
        <div className="grid size-full grid-cols-2">
          <InkFrame
            fill="hatch"
            className="flex size-full items-end justify-start rounded-s-md p-2 text-xs text-ink"
          >
            7
          </InkFrame>
          <InkFrame
            fill="tone"
            className="flex size-full items-end justify-end rounded-e-md p-2 text-xs text-ink"
          >
            6
          </InkFrame>
        </div>
      </AspectRatio>
      <figcaption className="text-sm text-muted-foreground">
        Chapter 12, pages 6 and 7: the jump across the rooftops.
      </figcaption>
    </figure>
  );
}
