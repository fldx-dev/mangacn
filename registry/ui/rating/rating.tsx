"use client";

import { cn } from "cn";
import { StarIcon } from "lucide-react";
import * as React from "react";

// mangacn rating: outlined ink stars, full ones ink-filled and half ones clipped in half. When
// interactive it is a radio group (one radio per value, so half steps are two radios per star)
// with roving focus; read-only it is one image named by its value.

/** Built-in words, each overridable through `labels`. */
const defaultLabels = {
  item: (n: number, max: number) => `${n} of ${max} stars`,
  readOnly: (value: number, max: number) => `Rated ${value} out of ${max}`,
};

const itemSizes = {
  sm: "size-6 [&_svg]:size-4",
  default: "size-11 [&_svg]:size-6",
  lg: "size-12 [&_svg]:size-8",
};

const itemClass = "relative inline-flex shrink-0 items-center justify-center rounded-md";

type RatingSize = keyof typeof itemSizes;

export interface RatingProps
  extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The rating, controlled. */
  value?: number;
  /**
   * The rating it starts with, uncontrolled.
   * @default 0
   */
  defaultValue?: number;
  /** Called with the new rating when a star is chosen. */
  onValueChange?: (value: number) => void;
  /**
   * How many stars.
   * @default 5
   */
  max?: number;
  /**
   * The smallest change: whole stars, or half stars for pointer and keyboard.
   * @default 1
   */
  step?: 1 | 0.5;
  /**
   * Shows the rating as one image, with no focus and no input.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Shows the stars without letting them change.
   * @default false
   */
  disabled?: boolean;
  /** The form field name; the rating posts with a plain `<form>`. */
  name?: string;
  /**
   * The star size; `default` and `lg` keep a 44 px hit area per star.
   * @default "default"
   */
  size?: RatingSize;
  /** The icon drawn for each star; lucide's `Star` by default. */
  icon?: React.ReactNode;
  /**
   * Each radio's name and the read-only image's name.
   * @default { item: (n, max) => `${n} of ${max} stars`, readOnly: (value, max) => `Rated ${value} out of ${max}` }
   */
  labels?: Partial<typeof defaultLabels>;
}

type StarState = "full" | "half" | "empty";

function starState(shown: number, star: number): StarState {
  if (shown >= star) return "full";
  if (shown >= star - 0.5) return "half";
  return "empty";
}

/** One star: the outline, and over it the ink fill, clipped to half for a half star. */
function Star({ icon, state }: { icon: React.ReactNode; state: StarState }) {
  return (
    <span aria-hidden="true" className="pointer-events-none relative inline-flex">
      <span className="inline-flex [&_svg]:fill-none">{icon}</span>
      {state !== "empty" && (
        <span
          className={cn(
            "absolute inset-0 inline-flex [&_svg]:fill-current",
            state === "half" && "[clip-path:inset(0_50%_0_0)]",
          )}
        >
          {icon}
        </span>
      )}
    </span>
  );
}

export function Rating({
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  step = 1,
  readOnly = false,
  disabled = false,
  name,
  size = "default",
  icon = <StarIcon strokeWidth={1.75} />,
  labels,
  className,
  onPointerLeave,
  ...props
}: RatingProps) {
  const words = { ...defaultLabels, ...labels };
  const [inner, setInner] = React.useState(defaultValue);
  const current = value ?? inner;
  const [hover, setHover] = React.useState<number | null>(null);
  const shown = hover ?? current;
  const radios = React.useRef<Array<HTMLSpanElement | null>>([]);

  const stars = Array.from({ length: max }, (_, index) => index + 1);
  const values = Array.from({ length: Math.round(max / step) }, (_, index) => (index + 1) * step);
  // The one tab stop: the chosen value's radio (or the last below it), else the first.
  const selectedIndex = values.reduce((found, v, index) => (v <= current ? index : found), -1);
  const tabIndex = Math.max(selectedIndex, 0);

  const select = (next: number) => {
    if (value === undefined) setInner(next);
    if (next !== current) onValueChange?.(next);
  };

  const hidden = name ? <input type="hidden" name={name} value={current} /> : null;

  if (readOnly) {
    return (
      <div
        role="img"
        data-slot="rating"
        data-readonly=""
        aria-label={words.readOnly(current, max)}
        className={cn("inline-flex items-center text-ink", className)}
        {...props}
      >
        {stars.map((star) => {
          const state = starState(current, star);
          return (
            <span
              key={star}
              data-slot="rating-item"
              data-state={state}
              // No hit area to keep: read-only stars sit close.
              className={cn(itemClass, itemSizes[size], "size-auto px-px")}
            >
              <Star icon={icon} state={state} />
            </span>
          );
        })}
        {hidden}
      </div>
    );
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>, index: number) => {
    const last = values.length - 1;
    const keys: Record<string, number> = {
      ArrowRight: Math.min(index + 1, last),
      ArrowUp: Math.min(index + 1, last),
      ArrowLeft: Math.max(index - 1, 0),
      ArrowDown: Math.max(index - 1, 0),
      Home: 0,
      End: last,
      " ": index,
    };
    const target = keys[event.key];
    if (target === undefined || disabled) return;
    event.preventDefault();
    select(values[target]);
    radios.current[target]?.focus();
  };

  const radio = (v: number, index: number, half?: "start" | "end") => (
    // biome-ignore lint/a11y/useSemanticElements: an APG radio group with roving focus; native radios cannot draw half stars.
    <span
      key={v}
      ref={(element) => {
        radios.current[index] = element;
      }}
      role="radio"
      aria-checked={v === current}
      aria-label={words.item(v, max)}
      aria-disabled={disabled || undefined}
      tabIndex={!disabled && index === tabIndex ? 0 : -1}
      className={cn(
        "cursor-pointer rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-not-allowed",
        half ? "absolute inset-y-0 w-1/2" : "absolute inset-0",
        half === "start" && "left-0",
        half === "end" && "right-0",
      )}
      onClick={() => {
        if (!disabled) select(v);
      }}
      onKeyDown={(event) => onKeyDown(event, index)}
      onPointerEnter={() => {
        if (!disabled) setHover(v);
      }}
    />
  );

  return (
    <div
      role="radiogroup"
      data-slot="rating"
      data-disabled={disabled ? "" : undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        "inline-flex items-center text-ink data-disabled:text-muted-foreground",
        className,
      )}
      onPointerLeave={(event) => {
        setHover(null);
        onPointerLeave?.(event);
      }}
      {...props}
    >
      {stars.map((star) => {
        const state = starState(shown, star);
        return (
          <span
            key={star}
            data-slot="rating-item"
            data-state={state}
            className={cn(itemClass, itemSizes[size])}
          >
            <Star icon={icon} state={state} />
            {step === 0.5
              ? [radio(star - 0.5, (star - 1) * 2, "start"), radio(star, (star - 1) * 2 + 1, "end")]
              : radio(star, star - 1)}
          </span>
        );
      })}
      {hidden}
    </div>
  );
}
