import { Slider } from "@/registry/ui/slider/slider";

export default function SliderDefaultVariant() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <span id="slider-variant-density" className="text-sm font-medium">
        Screentone density
      </span>
      <Slider aria-labelledby="slider-variant-density" defaultValue={[60]} />
    </div>
  );
}
