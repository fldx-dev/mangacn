"use client";

import { type ReactNode, useId } from "react";
import type { BaseColours } from "@/lib/create/colours";
import { baseValues } from "@/lib/create/colours";
import {
  type CreateConfig,
  type CustomLook,
  DIALOGUE_FONTS,
  DISPLAY_FONTS,
  type DialogueFont,
  type DisplayFont,
  HUE_RANGE,
  KIT_NAMES,
  type KitName,
  LOOK_PRESETS,
  type LookPreset,
  PEN_NAMES,
  PEN_RANGES,
  PEN_TOKENS,
  type PenToken,
  penName,
  type Range,
  SCREENTONE_RANGES,
  SCREENTONE_TOKENS,
  type ScreentoneToken,
  STRENGTH_RANGE,
  VIVIDNESS_RANGE,
} from "@/lib/create/config";
import { kitItems } from "@/lib/create/kits";
import { FONT_LABELS } from "@/lib/create/preview";
import { type CreateAction, CUSTOM_STARTS, maxDot } from "@/lib/create/state";
import type { Mode } from "@/lib/registry/contrast";
import { cn } from "@/lib/utils";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/registry/ui/field/field";
import { NativeSelect, NativeSelectOption } from "@/registry/ui/native-select/native-select";
import { RadioGroup, RadioGroupItem } from "@/registry/ui/radio-group/radio-group";
import { Separator } from "@/registry/ui/separator/separator";
import { Slider } from "@/registry/ui/slider/slider";
import { ToggleGroup, ToggleGroupItem } from "@/registry/ui/toggle-group/toggle-group";

export const LOOK_LABELS: Record<LookPreset | "custom", string> = {
  default: "Default",
  sepia: "Sepia",
  weekly: "Weekly",
  blueline: "Blueline",
  custom: "Custom",
};

const PEN_LABELS: Record<PenToken, string> = {
  "outline-width": "Outline width",
  "outline-width-heavy": "Heavy outline",
  "ink-roughness": "Roughness",
  "ink-bowing": "Bowing",
  "ink-offset": "Offset",
  "ink-hachure-gap": "Hachure gap",
};

const PEN_NAME_LABELS: Record<(typeof PEN_NAMES)[number], string> = {
  fine: "Fine",
  default: "Default",
  brush: "Brush",
};

const SCREENTONE_LABELS: Record<ScreentoneToken, string> = {
  "halftone-size": "Dot pitch",
  "halftone-dot": "Dot size",
  "speed-line-width": "Speed-line width",
};

export const KIT_LABELS: Record<KitName, { title: string; description: string }> = {
  basics: { title: "Basics", description: "The ink frame, a speech bubble and a button." },
  reader: { title: "Reader", description: "Read chapters: the reader, its lists and spreads." },
  "app-shell": { title: "App shell", description: "A sidebar layout with sign-in and sign-up." },
  chat: { title: "Chat", description: "A chat thread drawn as speech bubbles." },
  "series-site": { title: "Series site", description: "A series page, a library and characters." },
};

/** What a screen reader hears after the slider's name, for a unit. */
const UNIT_WORDS: Record<string, string> = { px: "in pixels", deg: "in degrees", "": "" };

function format(value: number, unit: string): string {
  return `${Number(value.toFixed(2))}${unit === "deg" ? "°" : unit}`;
}

/** A labelled slider on one of the configuration's ranges, its value printed beside it. */
function RangeField({
  label,
  range,
  value,
  onChange,
  max,
  unit = range.unit,
  swatch,
  hint,
}: {
  label: string;
  range: Range;
  value: number;
  onChange: (value: number) => void;
  /** A tighter maximum than the range's (the dot under its pitch). */
  max?: number;
  unit?: string;
  swatch?: string;
  hint?: ReactNode;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const unitWords = UNIT_WORDS[unit] ?? "";
  return (
    <div className="grid gap-1.5" data-slot="create-range">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2">
          {swatch && (
            <span
              aria-hidden="true"
              data-slot="create-swatch"
              className="inline-block size-4 shrink-0 rounded-full ink-border"
              style={{ background: swatch }}
            />
          )}
          <span id={labelId}>
            {label}
            {unitWords && <span className="sr-only">{`, ${unitWords}`}</span>}
          </span>
        </span>
        <output htmlFor={id} className="font-mono text-xs tabular-nums" aria-hidden="true">
          {format(value, unit)}
        </output>
      </div>
      <Slider
        id={id}
        aria-labelledby={labelId}
        min={range.min}
        max={max ?? range.max}
        step={range.step}
        value={[value]}
        format={unit === "deg" ? { style: "unit", unit: "degree" } : undefined}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : (next as number))}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function RailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="grid gap-3" data-slot="create-section">
      <div className="grid gap-0.5">
        <h2 id={id} className="font-display text-base tracking-wide">
          {title}
        </h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Paper with an ink and a spot dot: a look at a glance. */
function Swatch({ colours, preset }: { colours?: BaseColours; preset?: LookPreset }) {
  const style = colours
    ? ({
        "--paper": colours.paper,
        "--ink": colours.ink,
        "--spot": colours.spot,
      } as React.CSSProperties)
    : undefined;
  return (
    <span
      aria-hidden="true"
      data-theme-preset={preset}
      style={style}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-paper p-1 ink-border"
    >
      <span className="size-3 rounded-full bg-ink" />
      <span className="size-3 rounded-full bg-spot" />
    </span>
  );
}

const CUSTOM_PARTS: {
  part: keyof CustomLook;
  title: string;
  second: { key: "strength" | "vividness"; label: string; range: Range };
  colour: keyof BaseColours;
}[] = [
  {
    part: "paper",
    title: "Paper tint",
    second: { key: "strength", label: "Paper strength", range: STRENGTH_RANGE },
    colour: "paper",
  },
  {
    part: "ink",
    title: "Ink tint",
    second: { key: "strength", label: "Ink strength", range: STRENGTH_RANGE },
    colour: "ink",
  },
  {
    part: "spot",
    title: "Spot",
    second: { key: "vividness", label: "Spot vividness", range: VIVIDNESS_RANGE },
    colour: "spot",
  },
];

function LookSection({
  config,
  dispatch,
  mode,
}: {
  config: CreateConfig;
  dispatch: (action: CreateAction) => void;
  mode: Mode;
}) {
  const custom = "custom" in config.look ? config.look.custom : null;
  const current = custom ? "custom" : (config.look as { preset: LookPreset }).preset;
  const customColours = baseValues({
    custom: custom ?? CUSTOM_STARTS[current === "custom" ? "default" : current],
  })[mode];
  return (
    <RailSection title="Look" description="Paper, ink and the one spot colour.">
      <ToggleGroup
        aria-label="Look"
        variant="outline"
        orientation="vertical"
        spacing={0}
        className="w-full"
        value={[current]}
        onValueChange={(value: unknown[]) => {
          const next = value[0] as LookPreset | "custom" | undefined;
          if (!next || next === current) return;
          dispatch(
            next === "custom" ? { type: "look-custom" } : { type: "look-preset", preset: next },
          );
        }}
      >
        {[...LOOK_PRESETS, "custom" as const].map((look) => (
          <ToggleGroupItem key={look} value={look} className="justify-start gap-2.5 px-2.5">
            {look === "custom" ? <Swatch colours={customColours} /> : <Swatch preset={look} />}
            {LOOK_LABELS[look]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {custom && (
        <div className="grid gap-4" data-slot="create-custom-look">
          <p className="text-xs text-muted-foreground">
            A custom look always keeps text readable: the spot and tones are worked out against the
            paper in light and dark.
          </p>
          {CUSTOM_PARTS.map(({ part, title, second, colour }) => (
            <div key={part} className="grid gap-3">
              <RangeField
                label={`${title} hue`}
                range={HUE_RANGE}
                unit="deg"
                value={custom[part].hue}
                swatch={customColours[colour]}
                onChange={(value) => dispatch({ type: "look-value", part, key: "hue", value })}
              />
              <RangeField
                label={second.label}
                range={second.range}
                value={(custom[part] as Record<string, number>)[second.key]}
                onChange={(value) =>
                  dispatch(
                    part === "spot"
                      ? { type: "look-value", part, key: "vividness", value }
                      : { type: "look-value", part, key: "strength", value },
                  )
                }
              />
            </div>
          ))}
        </div>
      )}
    </RailSection>
  );
}

function PenSection({
  config,
  dispatch,
}: {
  config: CreateConfig;
  dispatch: (action: CreateAction) => void;
}) {
  const name = penName(config.pen);
  return (
    <RailSection title="Pen" description="How the outlines are drawn.">
      <div className="grid gap-1.5">
        <ToggleGroup
          aria-label="Named pen"
          variant="outline"
          spacing={0}
          className="w-full *:data-[slot=toggle-group-item]:flex-1"
          value={name ? [name] : []}
          onValueChange={(value: unknown[]) => {
            const next = value[0] as (typeof PEN_NAMES)[number] | undefined;
            if (next && next !== name) dispatch({ type: "pen-name", name: next });
          }}
        >
          {PEN_NAMES.map((pen) => (
            <ToggleGroupItem key={pen} value={pen}>
              {PEN_NAME_LABELS[pen]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground" data-slot="create-pen-name">
          {name ? `The ${name} pen.` : "A custom pen: your own settings."}
        </p>
      </div>
      {PEN_TOKENS.map((token) => (
        <RangeField
          key={token}
          label={PEN_LABELS[token]}
          range={PEN_RANGES[token]}
          value={config.pen[token]}
          onChange={(value) => dispatch({ type: "pen-value", token, value })}
        />
      ))}
    </RailSection>
  );
}

function ScreentoneSection({
  config,
  dispatch,
}: {
  config: CreateConfig;
  dispatch: (action: CreateAction) => void;
}) {
  const size = config.screentone["halftone-size"];
  const dotMax = maxDot(size);
  return (
    <RailSection title="Screentone" description="The halftone dots and speed lines.">
      {SCREENTONE_TOKENS.map((token) => (
        <RangeField
          key={token}
          label={SCREENTONE_LABELS[token]}
          range={SCREENTONE_RANGES[token]}
          value={config.screentone[token]}
          max={token === "halftone-dot" ? dotMax : undefined}
          hint={
            token === "halftone-dot"
              ? `At most ${dotMax}px on a ${size}px pitch, so the dots never touch.`
              : undefined
          }
          onChange={(value) => dispatch({ type: "screentone", token, value })}
        />
      ))}
    </RailSection>
  );
}

function FontsSection({
  config,
  dispatch,
}: {
  config: CreateConfig;
  dispatch: (action: CreateAction) => void;
}) {
  const id = useId();
  return (
    <RailSection title="Fonts">
      <Field>
        <FieldLabel htmlFor={`${id}-display`}>Display (titles and sound effects)</FieldLabel>
        <NativeSelect
          id={`${id}-display`}
          value={config.fonts.display}
          onChange={(event) =>
            dispatch({ type: "display-font", font: event.target.value as DisplayFont })
          }
        >
          {DISPLAY_FONTS.map((font) => (
            <NativeSelectOption key={font} value={font}>
              {FONT_LABELS[font]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-dialogue`}>Dialogue (speech and captions)</FieldLabel>
        <NativeSelect
          id={`${id}-dialogue`}
          value={config.fonts.dialogue}
          onChange={(event) =>
            dispatch({ type: "dialogue-font", font: event.target.value as DialogueFont })
          }
        >
          {DIALOGUE_FONTS.map((font) => (
            <NativeSelectOption key={font} value={font}>
              {FONT_LABELS[font]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
    </RailSection>
  );
}

/** The value a custom kit (only ever from a code) has in the radio group. */
const CUSTOM_KIT = "custom";

function KitSection({
  config,
  dispatch,
}: {
  config: CreateConfig;
  dispatch: (action: CreateAction) => void;
}) {
  const id = useId();
  const current = "preset" in config.kit ? config.kit.preset : CUSTOM_KIT;
  const options: { value: string; title: string; description: string; items: string[] }[] = [
    ...KIT_NAMES.map((kit) => ({
      value: kit,
      ...KIT_LABELS[kit],
      items: kitItems({ preset: kit }),
    })),
    ...("custom" in config.kit
      ? [
          {
            value: CUSTOM_KIT,
            title: "From the code",
            description: "The items this code lists.",
            items: kitItems(config.kit),
          },
        ]
      : []),
  ];
  return (
    <RailSection title="Start with" description="The items installed with the theme.">
      <RadioGroup
        aria-label="Starter kit"
        value={current}
        onValueChange={(value) => {
          if (typeof value === "string" && value !== CUSTOM_KIT && value !== current) {
            dispatch({ type: "kit", kit: value as KitName });
          }
        }}
      >
        {options.map((option) => (
          <FieldLabel key={option.value} htmlFor={`${id}-${option.value}`}>
            <Field orientation="horizontal">
              <RadioGroupItem value={option.value} id={`${id}-${option.value}`} />
              <FieldContent className="min-w-0">
                <span className="font-medium">{option.title}</span>
                <FieldDescription className="text-xs">{option.description}</FieldDescription>
                <span className="font-mono text-[0.7rem] break-words text-muted-foreground">
                  {option.items.join(", ")}
                </span>
              </FieldContent>
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </RailSection>
  );
}

/**
 * The Create page's choices: look, pen, screentone, fonts and a starter kit, each a labelled
 * section of registry items. Rendered in the desktop rail and in the phone's drawer alike.
 */
export function CreateRailSections({
  config,
  dispatch,
  mode,
  className,
}: {
  config: CreateConfig;
  dispatch: (action: CreateAction) => void;
  /** The preview's mode, for the custom look's swatches. */
  mode: Mode;
  className?: string;
}) {
  return (
    <div data-slot="create-rail-sections" className={cn("grid gap-6", className)}>
      <LookSection config={config} dispatch={dispatch} mode={mode} />
      <Separator />
      <PenSection config={config} dispatch={dispatch} />
      <Separator />
      <ScreentoneSection config={config} dispatch={dispatch} />
      <Separator />
      <FontsSection config={config} dispatch={dispatch} />
      <Separator />
      <KitSection config={config} dispatch={dispatch} />
    </div>
  );
}
