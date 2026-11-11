"use client";

import { DirectionProvider } from "@/registry/ui/direction/direction";
import { InkMark } from "@/registry/ui/ink-mark/ink-mark";
import { Slider } from "@/registry/ui/slider/slider";

export default function DirectionDefaultDemo() {
  return (
    // `dir` turns the text and the ink marks; the provider turns Base UI's slider, which now
    // fills from the right and steps the other way under the arrow keys.
    <DirectionProvider direction="rtl">
      <div lang="ar" dir="rtl" className="grid w-full max-w-xs gap-4">
        <p className="text-xl leading-loose">
          بدأت هذه القصة <InkMark>كسلسلة أسبوعية</InkMark> واستمرت عشر سنوات.
        </p>
        <span id="direction-demo-volume" className="text-sm font-medium">
          مستوى الحبر
        </span>
        <Slider aria-labelledby="direction-demo-volume" defaultValue={[60]} />
      </div>
    </DirectionProvider>
  );
}
