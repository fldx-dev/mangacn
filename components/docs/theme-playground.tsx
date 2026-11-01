"use client";

import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import type * as React from "react";
import { useId, useState } from "react";
import { InkFrame } from "@/registry/theme/ink-frame/ink-frame";
import { Button } from "@/registry/ui/button/button";

/** The pen variables of the theme (SPEC-manga-theme §17), with the theme's defaults. */
const PEN = [
  { name: "--outline-width", label: "Outline width", min: 0.5, max: 4, step: 0.1, unit: "px" },
  {
    name: "--outline-width-heavy",
    label: "Heavy outline width",
    min: 0.5,
    max: 6,
    step: 0.1,
    unit: "px",
  },
  { name: "--ink-roughness", label: "Roughness", min: 0, max: 3, step: 0.1, unit: "" },
  { name: "--ink-bowing", label: "Bowing", min: 0, max: 3, step: 0.1, unit: "" },
  { name: "--ink-offset", label: "Offset", min: 0, max: 4, step: 0.1, unit: "" },
  { name: "--ink-hachure-gap", label: "Hachure gap", min: 2, max: 10, step: 0.5, unit: "px" },
] as const;

type PenName = (typeof PEN)[number]["name"];

const DEFAULTS: Record<PenName, number> = {
  "--outline-width": 1.5,
  "--outline-width-heavy": 2.1,
  "--ink-roughness": 1.2,
  "--ink-bowing": 0.8,
  "--ink-offset": 1.5,
  "--ink-hachure-gap": 4,
};

/** A fixed first seed, so the server render and the first drawing agree. */
const FIRST_SEED = 12;

function cssValue(value: number, unit: string) {
  // Range steps of 0.1 arrive as floats (0.30000000000000004); two decimals are plenty.
  return `${Number(value.toFixed(2))}${unit}`;
}

/** Sliders for the pen variables, a live InkFrame preview and the CSS to paste. */
export function ThemePlayground() {
  const id = useId();
  const [values, setValues] = useState(DEFAULTS);
  const [seed, setSeed] = useState(FIRST_SEED);

  const declarations = PEN.map((pen) => [pen.name, cssValue(values[pen.name], pen.unit)] as const);
  const style = Object.fromEntries(declarations) as React.CSSProperties;
  const snippet = `:root {\n${declarations.map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`;
  // InkFrame reads the pen from computed style only when it draws (mount, resize, a new seed),
  // so a new key remounts the frames and they draw again with the slider values.
  const drawKey = declarations.map(([, value]) => value).join(" ");

  return (
    <div data-slot="theme-playground" className="not-prose my-6 grid min-w-0 gap-6">
      <div className="grid min-w-0 gap-6 md:grid-cols-2">
        <fieldset className="grid min-w-0 gap-4">
          <legend className="sr-only">Pen variables</legend>
          {PEN.map((pen) => {
            const inputId = `${id}${pen.name}`;
            return (
              <div key={pen.name} className="grid gap-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <label htmlFor={inputId} className="font-medium">
                    {pen.label} <code className="text-xs text-muted-foreground">{pen.name}</code>
                  </label>
                  <output htmlFor={inputId} className="font-mono text-xs tabular-nums">
                    {cssValue(values[pen.name], pen.unit)}
                  </output>
                </div>
                <input
                  id={inputId}
                  type="range"
                  min={pen.min}
                  max={pen.max}
                  step={pen.step}
                  value={values[pen.name]}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [pen.name]: Number(event.target.value),
                    }))
                  }
                  className="w-full accent-ink"
                />
              </div>
            );
          })}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSeed(Math.floor(Math.random() * 2147483645) + 1)}
            >
              Reroll seed
            </Button>
            <Button type="button" variant="ghost" onClick={() => setValues(DEFAULTS)}>
              Reset
            </Button>
          </div>
        </fieldset>
        <div
          data-slot="theme-playground-preview"
          data-seed={seed}
          style={style}
          className="flex min-w-0 flex-wrap content-center items-center justify-center gap-8 rounded-[var(--radius)] bg-paper p-8 text-ink"
        >
          <InkFrame
            key={`${drawKey}-outline`}
            seed={seed}
            lang="ja"
            className="px-5 py-3 font-display"
          >
            ドン！
          </InkFrame>
          <InkFrame
            key={`${drawKey}-heavy`}
            seed={seed + 1}
            className="px-5 py-3 font-dialogue [--outline-width:var(--outline-width-heavy)]"
          >
            Heavy panel
          </InkFrame>
          <InkFrame
            key={`${drawKey}-shadow`}
            seed={seed + 2}
            shadow="hatch"
            className="px-5 py-3 font-dialogue"
          >
            Hatched shadow
          </InkFrame>
        </div>
      </div>
      <CodeBlock title="globals.css">
        <Pre>
          {/* One `.line` per line, as Shiki emits, so Fumadocs' per-line padding applies. */}
          <code>
            {snippet.split("\n").map((line, index, lines) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: lines have no identity beyond order
              <span key={index} className="line">
                {line}
                {index < lines.length - 1 ? "\n" : null}
              </span>
            ))}
          </code>
        </Pre>
      </CodeBlock>
    </div>
  );
}
