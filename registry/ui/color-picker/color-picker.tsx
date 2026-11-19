"use client";

import { cn } from "cn";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

// mangacn color-picker: a swatch trigger opening popover's heavy-outlined paper with a
// saturation/brightness area, hue and alpha on mangacn's slider, a hex input and optional
// swatches. The colours it shows are the user's, so they are literals; everything around them
// (outlines, thumbs, focus rings) is ink and paper.

export interface ColorPickerProps {
  /** The colour as `#rrggbb`, or `#rrggbbaa` when it is not opaque (controlled). */
  value?: string;
  /**
   * The colour at first (uncontrolled).
   * @default "#000000"
   */
  defaultValue?: string;
  /** Called with the new colour (lowercase `#rrggbb`, or `#rrggbbaa` below full opacity). */
  onValueChange?: (hex: string) => void;
  /**
   * Shows the alpha slider and accepts 8-digit hex.
   * @default true
   */
  alpha?: boolean;
  /**
   * Preset colours under the panel, as a radio group. Two spellings of one colour (`#fff`,
   * `#ffffff`) show once; a swatch that is not valid hex falls back to `#000000`.
   */
  swatches?: string[];
  /**
   * Disables the trigger and every control.
   * @default false
   */
  disabled?: boolean;
  /** Posts the hex in a hidden input under this name with a plain `<form>`. */
  name?: string;
  /** Whether the panel is open (controlled; `ColorPicker` only). */
  open?: boolean;
  /**
   * Whether the panel is open at first (uncontrolled; `ColorPicker` only).
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the panel opens or closes (`ColorPicker` only). */
  onOpenChange?: (open: boolean) => void;
  /**
   * Built-in words: `trigger` ("Colour", named with the value as "Colour, #e60012"), `area`
   * ("Saturation and brightness"), `saturation` and `brightness` (the area's value text), `hue`
   * ("Hue"), `alpha` ("Alpha"), `hex` ("Hex"), `invalid` (the hex error, "Use a hex colour such as
   * #e60012.") and `swatches` ("Swatches").
   */
  labels?: {
    trigger?: string;
    area?: string;
    saturation?: string;
    brightness?: string;
    hue?: string;
    alpha?: string;
    hex?: string;
    invalid?: string;
    swatches?: string;
  };
  /** The focusable element's id (the trigger, or the panel's area), for a `FieldLabel htmlFor`. */
  id?: string;
  /** Describes the trigger (a `FieldDescription` or `FieldError`). */
  "aria-describedby"?: string;
  /** Marks the trigger invalid: a spot outline. */
  "aria-invalid"?: boolean;
  /** Classes for the root (the trigger's wrapper, or the panel). */
  className?: string;
}

const DEFAULT_LABELS = {
  trigger: "Colour",
  area: "Saturation and brightness",
  saturation: "saturation",
  brightness: "brightness",
  hue: "Hue",
  alpha: "Alpha",
  hex: "Hex",
  invalid: "Use a hex colour such as #e60012.",
  swatches: "Swatches",
};

// Colour maths (hex ↔ HSV), inline so the item installs as one file. h in degrees [0, 360),
// s and v in [0, 1], a in [0, 1].

interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}

/** `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` (the `#` optional) → 0–255 channels, or null. */
function parseHex(input: string, alpha: boolean): [number, number, number, number] | null {
  const hex = input.trim().replace(/^#/, "");
  if (!/^[0-9a-f]+$/i.test(hex)) return null;
  const lengths = alpha ? [3, 4, 6, 8] : [3, 6];
  if (!lengths.includes(hex.length)) return null;
  const full = hex.length <= 4 ? [...hex].map((digit) => digit + digit).join("") : hex;
  const channel = (index: number) => Number.parseInt(full.slice(index * 2, index * 2 + 2), 16);
  return [channel(0), channel(1), channel(2), full.length === 8 ? channel(3) : 255];
}

function hexToHsva(input: string): Hsva {
  const [r, g, b, a] = (parseHex(input, true) ?? [0, 0, 0, 255]).map((value) => value / 255);
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let h = 0;
  if (delta > 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  return { h: (h * 60 + 360) % 360, s: max === 0 ? 0 : delta / max, v: max, a };
}

function hsvaToHex({ h, s, v, a }: Hsva, alpha: boolean): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const byte = (value: number) =>
    Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  const opaque = !alpha || Math.round(a * 255) === 255;
  return `#${byte(f(5))}${byte(f(3))}${byte(f(1))}${opaque ? "" : byte(a)}`;
}

/** The value as the picker writes it: lowercase, six digits, eight below full opacity. */
function normalize(input: string, alpha: boolean): string {
  return hsvaToHex(hexToHsva(input), alpha);
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const percent = (value: number) => Math.round(value * 100);

const HUE_GRADIENT =
  "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)";

/** Controlled-or-uncontrolled hex, normalised. */
function useHex(
  props: Pick<ColorPickerProps, "value" | "defaultValue" | "onValueChange">,
  alpha: boolean,
) {
  const [inner, setInner] = React.useState(props.defaultValue ?? "#000000");
  const hex = normalize(props.value ?? inner, alpha);
  const setHex = (next: string) => {
    if (next === hex) return;
    if (props.value === undefined) setInner(next);
    props.onValueChange?.(next);
  };
  return [hex, setHex] as const;
}

/** A bar behind a slider showing the colours it picks, outlined in ink. */
function SliderBar({ background, className }: { background: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-1/2 isolate h-3 -translate-y-1/2 rounded-sm",
        className,
      )}
    >
      <span className="absolute inset-0 rounded-sm" style={{ background }} />
      <InkFrame as="span" fill="none" className="pointer-events-none absolute inset-0 rounded-sm" />
    </span>
  );
}

/** mangacn's slider over a colour bar: no rule or ink range, so the bar shows through. */
function ColorSlider({
  slot,
  labelledBy,
  ...props
}: React.ComponentProps<typeof Slider> & { slot: string; labelledBy: string }) {
  return (
    <Slider
      data-slot={slot}
      aria-labelledby={labelledBy}
      className="**:data-[slot=slider-range]:invisible [&_[data-slot=slider-track]>[data-slot=ink-frame]]:invisible"
      {...props}
    />
  );
}

type PanelProps = Omit<ColorPickerProps, "open" | "defaultOpen" | "onOpenChange">;

/** The panel alone, for inline use: the area, hue and alpha sliders, the hex input and swatches. */
export function ColorPickerPanel({
  alpha = true,
  swatches,
  disabled = false,
  name,
  labels,
  id,
  className,
  ...props
}: PanelProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [hex, setHex] = useHex(props, alpha);
  const ids = React.useId();

  // HSV is the working state, so the hue survives greys and black; it follows a new value.
  const [hsva, setHsva] = React.useState(() => hexToHsva(hex));
  const [seen, setSeen] = React.useState(hex);
  if (seen !== hex) {
    setSeen(hex);
    if (hsvaToHex(hsva, alpha) !== hex) setHsva(hexToHsva(hex));
  }
  const commit = (next: Hsva) => {
    setHsva(next);
    const nextHex = hsvaToHex(next, alpha);
    setSeen(nextHex);
    setHex(nextHex);
  };

  // The hex field: a draft committed on Enter or blur.
  const [draft, setDraft] = React.useState(hex);
  const [invalid, setInvalid] = React.useState(false);
  const [drafted, setDrafted] = React.useState(hex);
  if (drafted !== hex) {
    setDrafted(hex);
    setDraft(hex);
    setInvalid(false);
  }
  const commitDraft = () => {
    if (!parseHex(draft, alpha)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    const next = normalize(`#${draft.trim().replace(/^#/, "")}`, alpha);
    setDraft(next);
    if (next !== hex) commit(hexToHsva(next));
  };

  // The 2D area: pointer drag and arrow keys.
  const areaRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const pointTo = (event: React.PointerEvent) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    commit({
      ...hsva,
      s: clamp((event.clientX - rect.left) / rect.width),
      v: clamp(1 - (event.clientY - rect.top) / rect.height),
    });
  };
  const onAreaKeyDown = (event: React.KeyboardEvent) => {
    const step = (event.shiftKey ? 10 : 1) / 100;
    const moves: Record<string, Partial<Hsva>> = {
      ArrowLeft: { s: clamp(hsva.s - step) },
      ArrowRight: { s: clamp(hsva.s + step) },
      ArrowDown: { v: clamp(hsva.v - step) },
      ArrowUp: { v: clamp(hsva.v + step) },
    };
    const move = moves[event.key];
    if (!move || disabled) return;
    event.preventDefault();
    commit({ ...hsva, ...move });
  };

  const [r, g, b] = parseHex(hsvaToHex({ ...hsva, a: 1 }, false), false) ?? [0, 0, 0];
  // One swatch per normalised hex, so keys are unique and at most one is checked.
  const colors = swatches && [...new Set(swatches.map((swatch) => normalize(swatch, alpha)))];
  const checked = colors?.find((color) => color === hex);
  const swatchRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onSwatchKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (!colors) return;
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + colors.length) % colors.length;
    swatchRefs.current[next]?.focus();
    commit(hexToHsva(colors[next]));
  };

  return (
    <div
      data-slot="color-picker-panel"
      data-disabled={disabled || undefined}
      className={cn("flex w-64 max-w-full flex-col gap-3", className)}
    >
      <div
        ref={areaRef}
        id={id}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-roledescription="2D slider"
        aria-label={words.area}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent(hsva.s)}
        aria-valuetext={`${words.saturation} ${percent(hsva.s)} %, ${words.brightness} ${percent(hsva.v)} %`}
        aria-disabled={disabled || undefined}
        data-slot="color-picker-area"
        data-dragging={dragging || undefined}
        className="relative isolate aspect-square w-full touch-none rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:pointer-events-none"
        style={{
          background: `linear-gradient(to top, #000000, transparent), linear-gradient(to right, #ffffff, transparent), hsl(${Math.round(hsva.h)} 100% 50%)`,
        }}
        onKeyDown={onAreaKeyDown}
        onPointerDown={(event) => {
          if (disabled || event.button !== 0) return;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          setDragging(true);
          pointTo(event);
        }}
        onPointerMove={(event) => {
          if (dragging) pointTo(event);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <InkFrame
          as="span"
          fill="none"
          className="pointer-events-none absolute inset-0 -z-1 rounded-md"
        />
        <span
          data-slot="color-picker-area-thumb"
          className="pointer-events-none absolute isolate size-4 -translate-1/2 rounded-full bg-background has-[>[data-inked=true]]:bg-transparent!"
          style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%` }}
        >
          <InkFrame
            as="span"
            shape="ellipse"
            fill="paper"
            className="pointer-events-none absolute inset-0 -z-1"
          />
        </span>
      </div>

      <div className="relative flex h-4 items-center">
        <SliderBar background={HUE_GRADIENT} />
        <span id={`${ids}-hue`} className="sr-only">
          {words.hue}
        </span>
        <ColorSlider
          slot="color-picker-hue"
          labelledBy={`${ids}-hue`}
          min={0}
          max={359}
          value={[Math.round(hsva.h) % 360]}
          onValueChange={(next) => commit({ ...hsva, h: Array.isArray(next) ? next[0] : next })}
          disabled={disabled}
        />
      </div>

      {alpha && (
        <div className="relative flex h-4 items-center">
          <SliderBar
            background={`linear-gradient(to right, transparent, rgb(${r} ${g} ${b}))`}
            className="halftone-light"
          />
          <span id={`${ids}-alpha`} className="sr-only">
            {words.alpha}
          </span>
          <ColorSlider
            slot="color-picker-alpha"
            labelledBy={`${ids}-alpha`}
            min={0}
            max={100}
            value={[percent(hsva.a)]}
            onValueChange={(next) =>
              commit({ ...hsva, a: (Array.isArray(next) ? next[0] : next) / 100 })
            }
            disabled={disabled}
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor={`${ids}-hex`} className="sr-only">
          {words.hex}
        </label>
        <Input
          id={`${ids}-hex`}
          data-slot="color-picker-input"
          value={draft}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${ids}-error` : undefined}
          className="font-mono"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            commitDraft();
          }}
        />
        {invalid && (
          <p id={`${ids}-error`} role="alert" className="text-sm text-destructive">
            {words.invalid}
          </p>
        )}
      </div>

      {colors && colors.length > 0 && (
        <div
          role="radiogroup"
          aria-label={words.swatches}
          aria-disabled={disabled || undefined}
          data-slot="color-picker-swatches"
          className="flex flex-wrap gap-1.5"
        >
          {colors.map((color, index) => {
            const isChecked = color === checked;
            const tabbable = checked ? isChecked : index === 0;
            return (
              // biome-ignore lint/a11y/useSemanticElements: a swatch is a button filled with its colour, as a radio
              <button
                key={color}
                ref={(element) => {
                  swatchRefs.current[index] = element;
                }}
                type="button"
                role="radio"
                aria-checked={isChecked}
                aria-label={color}
                tabIndex={tabbable ? 0 : -1}
                disabled={disabled}
                data-slot="color-picker-swatch"
                data-state={isChecked ? "checked" : "unchecked"}
                className="relative isolate size-6 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none"
                style={{ background: color }}
                onClick={() => commit(hexToHsva(color))}
                onKeyDown={(event) => onSwatchKeyDown(event, index)}
              >
                <InkFrame
                  as="span"
                  fill="none"
                  className={cn(
                    "pointer-events-none absolute inset-0 -z-1 rounded-sm",
                    isChecked && "[--outline-width:var(--outline-width-heavy)]",
                  )}
                />
              </button>
            );
          })}
        </div>
      )}

      {name && <input type="hidden" name={name} value={hex} disabled={disabled} />}
    </div>
  );
}

/** A swatch trigger that opens the panel in a popover. */
export function ColorPicker({
  open,
  defaultOpen,
  onOpenChange,
  alpha = true,
  disabled = false,
  name,
  labels,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  value,
  defaultValue,
  onValueChange,
  ...panel
}: ColorPickerProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [hex, setHex] = useHex({ value, defaultValue, onValueChange }, alpha);

  return (
    <div data-slot="color-picker" className={cn("inline-flex", className)}>
      <Popover
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      >
        <PopoverTrigger
          render={<Button variant="outline" />}
          id={id}
          disabled={disabled}
          aria-label={`${words.trigger}, ${hex}`}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid || undefined}
          data-slot="color-picker-trigger"
          className="gap-2 font-mono aria-invalid:[--ink:var(--destructive)]"
        >
          <span aria-hidden className="relative isolate size-4 rounded-xs halftone-light">
            <span className="absolute inset-0 rounded-xs" style={{ background: hex }} />
          </span>
          {hex}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          data-slot="color-picker-content"
          className="w-[calc(16rem+--spacing(5))] max-w-[calc(100vw---spacing(4))]"
        >
          <ColorPickerPanel
            {...panel}
            value={hex}
            onValueChange={setHex}
            alpha={alpha}
            disabled={disabled}
            labels={labels}
            className="w-full"
          />
        </PopoverContent>
      </Popover>
      {name && <input type="hidden" name={name} value={hex} disabled={disabled} />}
    </div>
  );
}
