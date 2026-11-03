import { Slider } from "@/registry/ui/slider/slider";

export default function SliderDisabledDemo() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <span id="slider-disabled-bleed" className="text-sm font-medium">
        Bleed (locked by the printer)
      </span>
      <Slider aria-labelledby="slider-disabled-bleed" defaultValue={[30]} disabled />
    </div>
  );
}
