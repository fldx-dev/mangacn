import { Slider } from "@/registry/ui/slider/slider";

export default function SliderRangeDemo() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <span id="slider-range-pages" className="text-sm font-medium">
        Pages to export
      </span>
      <Slider
        aria-labelledby="slider-range-pages"
        defaultValue={[4, 18]}
        min={1}
        max={24}
        minStepsBetweenValues={1}
      />
    </div>
  );
}
