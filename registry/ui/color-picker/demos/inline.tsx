"use client";

import * as React from "react";
import { ColorPickerPanel } from "@/registry/ui/color-picker/color-picker";

export default function ColorPickerInlineDemo() {
  const [ink, setInk] = React.useState("#1d2088");
  return (
    <div className="flex w-full max-w-64 flex-col gap-2">
      <ColorPickerPanel value={ink} onValueChange={setInk} alpha={false} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Ink: <span className="font-mono">{ink}</span>
      </p>
    </div>
  );
}
