"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "cn";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Slider (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-03.
// Restyled for mangacn: the track is one hand-drawn rule, the range an ink bar drawn over it,
// and each thumb a paper disc with an ink outline, like `switch`'s thumb. The track no longer
// clips (the drawing reaches past its box). Disabled sliders draw in the muted tone. Every
// slider shares the seeds.

/** One wobble for every slider rule, range and thumb. */
const SLIDER_SEED = 17;

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:cursor-not-allowed data-disabled:opacity-100 data-disabled:[--ink:var(--muted-foreground)] data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="group/slider-track relative isolate grow select-none data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
        >
          {/* The rule: an outline-width box through the middle of the track, like `separator`. */}
          <InkFrame
            as="span"
            shape="line"
            fill="none"
            seed={SLIDER_SEED}
            className="pointer-events-none absolute -z-1 group-data-horizontal/slider-track:inset-x-0 group-data-horizontal/slider-track:top-1/2 group-data-horizontal/slider-track:h-(--outline-width) group-data-horizontal/slider-track:-translate-y-1/2 group-data-vertical/slider-track:inset-y-0 group-data-vertical/slider-track:left-1/2 group-data-vertical/slider-track:w-(--outline-width) group-data-vertical/slider-track:-translate-x-1/2"
          />
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="isolate bg-primary select-none has-[>[data-inked=true]]:bg-transparent! data-horizontal:h-full data-vertical:w-full"
          >
            <InkFrame
              as="span"
              fill="ink"
              seed={SLIDER_SEED + 1}
              className="pointer-events-none absolute inset-0 -z-1"
            />
          </SliderPrimitive.Indicator>
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            // biome-ignore lint/suspicious/noArrayIndexKey: stock keys thumbs by their index
            key={index}
            className="relative isolate block size-4 shrink-0 rounded-full border-0 bg-background ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-100 has-[>[data-inked=true]]:bg-transparent!"
          >
            <InkFrame
              as="span"
              shape="ellipse"
              fill="paper"
              seed={SLIDER_SEED + 2}
              className="pointer-events-none absolute inset-0 -z-1"
            />
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
