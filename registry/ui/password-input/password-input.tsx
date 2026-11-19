"use client";

import { Meter as MeterPrimitive } from "@base-ui/react/meter";
import { cn } from "cn";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

// mangacn password input: mangacn's input group holding the input and a show / hide toggle in one
// hand-drawn frame, with an optional four-segment strength meter (Base UI's Meter) under it.

type Strength = 0 | 1 | 2 | 3 | 4;
type StrengthLabels = [string, string, string, string, string];

/** Built-in words, each overridable through `labels`. */
const defaultLabels = {
  show: "Show password",
  hide: "Hide password",
  strength: ["Too weak", "Weak", "Fair", "Good", "Strong"] as StrengthLabels,
};

/**
 * A small built-in strength heuristic: length (8 and 12 characters) and character classes
 * (lower case, upper case, digits, symbols). No dictionary, no dependency; anything under 8
 * characters scores at most 1.
 */
export function getPasswordStrength(value: string): Strength {
  if (!value) return 0;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (classes >= 2) score++;
  if (classes >= 3) score++;
  if (value.length < 8) score = Math.min(score, 1);
  return Math.min(score, 4) as Strength;
}

export interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  /** Whether the password shows as plain text, controlled. */
  visible?: boolean;
  /**
   * Whether the password starts shown, uncontrolled.
   * @default false
   */
  defaultVisible?: boolean;
  /** Called with the new visibility when the toggle is pressed. */
  onVisibleChange?: (visible: boolean) => void;
  /**
   * Shows the four-segment strength meter and its word under the field.
   * @default false
   */
  showStrength?: boolean;
  /** Scores a password from 0 to 4, replacing `getPasswordStrength`. */
  strength?: (value: string) => Strength;
  /**
   * The toggle's name and title, and the five strength words (0 to 4). The toggle keeps one name
   * (`show`) and reports its state through `aria-pressed`, so `hide` is no longer read.
   * @default { show: "Show password", hide: "Hide password", strength: ["Too weak", "Weak", "Fair", "Good", "Strong"] }
   */
  labels?: Partial<typeof defaultLabels>;
  /** Classes for the root, which fills its container. */
  className?: string;
}

export function PasswordInput({
  visible,
  defaultVisible = false,
  onVisibleChange,
  showStrength = false,
  strength = getPasswordStrength,
  labels,
  className,
  id,
  value,
  defaultValue,
  onChange,
  "aria-describedby": describedBy,
  ...props
}: PasswordInputProps) {
  const words = { ...defaultLabels, ...labels };
  const fallbackId = React.useId();
  const inputId = id ?? fallbackId;
  const meterId = React.useId();

  const [innerVisible, setInnerVisible] = React.useState(defaultVisible);
  const shown = visible ?? innerVisible;
  const toggle = () => {
    if (visible === undefined) setInnerVisible(!shown);
    onVisibleChange?.(!shown);
  };

  // The text the meter scores: the controlled value, else what has been typed.
  const [typed, setTyped] = React.useState(String(defaultValue ?? ""));
  const text = value !== undefined ? String(value) : typed;
  const score = showStrength ? strength(text) : 0;

  return (
    <div data-slot="password-input" className={cn("flex w-full min-w-0 flex-col gap-2", className)}>
      <InputGroup>
        <InputGroupInput
          id={inputId}
          type={shown ? "text" : "password"}
          value={value}
          defaultValue={defaultValue}
          aria-describedby={
            [describedBy, showStrength ? meterId : undefined].filter(Boolean).join(" ") || undefined
          }
          onChange={(event) => {
            setTyped(event.target.value);
            onChange?.(event);
          }}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            data-slot="password-input-toggle"
            size="icon-xs"
            aria-label={words.show}
            aria-pressed={shown}
            aria-controls={inputId}
            title={words.show}
            disabled={props.disabled}
            onClick={toggle}
          >
            {shown ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {showStrength && (
        <MeterPrimitive.Root
          id={meterId}
          data-slot="password-input-strength"
          value={score}
          min={0}
          max={4}
          getAriaValueText={() => words.strength[score]}
          className="flex items-center gap-3"
        >
          <MeterPrimitive.Track className="flex min-w-0 flex-1 gap-1">
            {[1, 2, 3, 4].map((segment) => (
              <span
                key={segment}
                data-slot="password-input-strength-segment"
                data-state={segment <= score ? "filled" : "empty"}
                className="relative isolate h-1.5 min-w-0 flex-1"
              >
                <InkFrame
                  as="span"
                  seed={segment}
                  fill={segment <= score ? "ink" : "none"}
                  className="pointer-events-none absolute inset-0 -z-1"
                />
              </span>
            ))}
          </MeterPrimitive.Track>
          <MeterPrimitive.Label className="shrink-0 text-xs text-muted-foreground">
            {words.strength[score]}
          </MeterPrimitive.Label>
        </MeterPrimitive.Root>
      )}
    </div>
  );
}
