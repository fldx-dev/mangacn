import { HalftoneBackground } from "@/registry/ui/halftone-background/halftone-background";

export default function HalftoneBackgroundDefaultVariant() {
  return (
    <div className="relative isolate grid aspect-video w-full max-w-xl place-items-center bg-paper">
      <HalftoneBackground fade="top" />
      <p className="font-display text-3xl uppercase">Dusk falls</p>
    </div>
  );
}
