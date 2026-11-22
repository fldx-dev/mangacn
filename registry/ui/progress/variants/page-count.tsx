"use client";

import { Progress, ProgressLabel, ProgressValue } from "@/registry/ui/progress/progress";

const PAGES = 18;

function pageText(value: number | null) {
  return `Page ${value} of ${PAGES}`;
}

export default function ProgressPageCountVariant() {
  return (
    <Progress
      value={12}
      max={PAGES}
      getAriaValueText={(_, value) => pageText(value)}
      className="w-full max-w-xs"
    >
      <ProgressLabel>Chapter 12: Rooftop</ProgressLabel>
      <ProgressValue>{(_, value) => pageText(value)}</ProgressValue>
    </Progress>
  );
}
