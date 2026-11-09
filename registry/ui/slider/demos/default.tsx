import { Slider } from "@/registry/ui/slider/slider";

export default function SliderDefaultDemo() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <span id="slider-demo-density" className="text-sm font-medium">
        Screentone density
      </span>
      <Slider aria-labelledby="slider-demo-density" defaultValue={[60]} />
    </div>
  );
}
