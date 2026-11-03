"use client";

import type * as React from "react";
import { useId, useState } from "react";
import { InkFrame } from "@/registry/theme/ink-frame/ink-frame";
import { Slider } from "@/registry/ui/slider/slider";

/** Two of the pen variables, with the theme's defaults (the full set is on the theming page). */
const PEN = [
  { name: "--outline-width", label: "Outline width", min: 0.5, max: 4, step: 0.1, unit: "px" },
  { name: "--ink-roughness", label: "Roughness", min: 0, max: 3, step: 0.1, unit: "" },
] as const;

type PenName = (typeof PEN)[number]["name"];

const DEFAULTS: Record<PenName, number> = { "--outline-width": 1.5, "--ink-roughness": 1.2 };

function cssValue(value: number, unit: string) {
  // Range steps of 0.1 arrive as floats (0.30000000000000004); two decimals are plenty.
  return `${Number(value.toFixed(2))}${unit}`;
}

/** Two registry sliders bound to one live InkFrame: the landing's teaser for `ThemePlayground`. */
export function InkTeaser() {
  const id = useId();
  const [values, setValues] = useState(DEFAULTS);
  const declarations = PEN.map((pen) => [pen.name, cssValue(values[pen.name], pen.unit)] as const);
  const style = Object.fromEntries(declarations) as React.CSSProperties;
  // InkFrame reads the pen from computed style only when it draws, so a new key redraws it.
  const drawKey = declarations.map(([, value]) => value).join(" ");

  return (
    <div
      data-slot="ink-teaser"
      className="grid min-w-0 gap-5 sm:grid-cols-[1fr_auto] sm:items-center"
    >
      <fieldset className="grid min-w-0 gap-4">
        <legend className="sr-only">Pen variables</legend>
        {PEN.map((pen) => {
          const sliderId = `${id}${pen.name}`;
          const labelId = `${sliderId}-label`;
          return (
            <div key={pen.name} className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span id={labelId} className="font-medium">
                  {pen.label}
                </span>
                <output htmlFor={sliderId} className="font-mono text-xs tabular-nums">
                  {cssValue(values[pen.name], pen.unit)}
                </output>
              </div>
              <Slider
                id={sliderId}
                aria-labelledby={labelId}
                min={pen.min}
                max={pen.max}
                step={pen.step}
                value={[values[pen.name]]}
                onValueChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    [pen.name]: Array.isArray(value) ? value[0] : value,
                  }))
                }
              />
            </div>
          );
        })}
      </fieldset>
      <div style={style} className="flex justify-center p-3">
        <InkFrame key={drawKey} seed={12} lang="ja" className="px-6 py-4 font-display text-2xl">
          ドン！
        </InkFrame>
      </div>
    </div>
  );
}
