"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

// mangacn multi-select: the one-line version of combobox's `multiple` mode. An options array in,
// string values out; every part is combobox's (one outlined chips field, outlined paper chips,
// the paper list with an ink highlight), so it looks and behaves like combobox.

/** One choice in the list. */
export interface MultiSelectOption {
  /** What `onValueChange` returns and the form posts. */
  value: string;
  /** What the list and the chip show; typing filters on it. */
  label: string;
  /** Shown but not pickable. */
  disabled?: boolean;
  /** Options with the same `group` render together under this label, in first-seen order. */
  group?: string;
}

export interface MultiSelectProps {
  /** The choices, in list order. */
  options: MultiSelectOption[];
  /** The picked values (controlled). */
  value?: string[];
  /**
   * The values picked at first (uncontrolled).
   * @default []
   */
  defaultValue?: string[];
  /** Called with every picked value, in pick order, when one is added or removed. */
  onValueChange?: (values: string[]) => void;
  /** The input's placeholder. */
  placeholder?: string;
  /** The most values that can be picked; at the limit the other options are disabled and say why. */
  maxSelected?: number;
  /**
   * Disables the field, its chips and the list.
   * @default false
   */
  disabled?: boolean;
  /** Posts one hidden input per picked value under this name with a plain `<form>`. */
  name?: string;
  /**
   * Built-in words: `empty` when nothing matches ("No results."), `remove` names a chip's remove
   * button ("Remove {label}"), `limit` describes a disabled option at `maxSelected` ("Up to {max}
   * can be picked.").
   */
  labels?: { empty?: string; remove?: string; limit?: string };
  /** The input's id, for a `FieldLabel htmlFor`. */
  id?: string;
  /** Classes for the root (the field's width goes here). */
  className?: string;
  /** Names the input when no label points at it. */
  "aria-label"?: string;
  /** Names the input by another element. */
  "aria-labelledby"?: string;
  /** Describes the input (a `FieldDescription` or `FieldError`). */
  "aria-describedby"?: string;
  /** Marks the field invalid: a spot outline, as `input` draws it. */
  "aria-invalid"?: boolean;
}

const DEFAULT_LABELS = {
  empty: "No results.",
  remove: "Remove {label}",
  limit: "Up to {max} can be picked.",
};

interface OptionGroup {
  value: string;
  items: MultiSelectOption[];
}

const sameOption = (a: MultiSelectOption, b: MultiSelectOption) => a.value === b.value;

export function MultiSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  maxSelected,
  disabled = false,
  name,
  labels,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: MultiSelectProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const anchor = useComboboxAnchor();
  const limitId = React.useId();
  const [inner, setInner] = React.useState<string[]>(defaultValue ?? []);
  const values = value ?? inner;

  const byValue = React.useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  );
  const selected = React.useMemo(
    () => values.flatMap((picked) => byValue.get(picked) ?? []),
    [values, byValue],
  );
  // Groups in first-seen order; options without a group come first, with no label.
  const groups = React.useMemo<OptionGroup[] | null>(() => {
    if (!options.some((option) => option.group)) return null;
    const map = new Map<string, MultiSelectOption[]>();
    for (const option of options) {
      const key = option.group ?? "";
      map.set(key, [...(map.get(key) ?? []), option]);
    }
    return [...map].map(([group, items]) => ({ value: group, items }));
  }, [options]);

  const atLimit = maxSelected !== undefined && values.length >= maxSelected;
  const isPicked = (option: MultiSelectOption) => values.includes(option.value);
  const limited = (option: MultiSelectOption) => atLimit && !isPicked(option);

  const handleChange = (next: MultiSelectOption[]) => {
    const nextValues = next.map((option) => option.value);
    if (value === undefined) setInner(nextValues);
    onValueChange?.(nextValues);
  };

  const renderItem = (option: MultiSelectOption) => (
    <ComboboxItem
      key={option.value}
      value={option}
      disabled={option.disabled || limited(option)}
      aria-describedby={limited(option) ? limitId : undefined}
    >
      {option.label}
    </ComboboxItem>
  );

  return (
    <div
      data-slot="multi-select"
      data-disabled={disabled || undefined}
      className={cn("w-full", className)}
    >
      <Combobox
        multiple
        items={groups ?? options}
        value={selected}
        onValueChange={handleChange}
        isItemEqualToValue={sameOption}
        disabled={disabled}
        name={name}
      >
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(picked: MultiSelectOption[]) => (
              <React.Fragment>
                {picked.map((option) => (
                  <ComboboxChip key={option.value} showRemove={false}>
                    {option.label}
                    {!disabled && (
                      <ComboboxPrimitive.ChipRemove
                        render={<Button variant="ghost" size="icon-xs" />}
                        className="-ml-1 opacity-50 hover:opacity-100"
                        data-slot="combobox-chip-remove"
                        aria-label={words.remove.replace("{label}", option.label)}
                      >
                        <XIcon className="pointer-events-none" />
                      </ComboboxPrimitive.ChipRemove>
                    )}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput
                  id={id}
                  placeholder={placeholder}
                  aria-label={ariaLabel}
                  aria-labelledby={ariaLabelledBy}
                  aria-describedby={ariaDescribedBy}
                  aria-invalid={ariaInvalid || undefined}
                />
              </React.Fragment>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>{words.empty}</ComboboxEmpty>
          <ComboboxList>
            {groups
              ? (group: OptionGroup, index: number) => (
                  <ComboboxGroup key={group.value} items={group.items}>
                    {group.value && <ComboboxLabel>{group.value}</ComboboxLabel>}
                    <ComboboxCollection>{renderItem}</ComboboxCollection>
                    {index < groups.length - 1 && <ComboboxSeparator />}
                  </ComboboxGroup>
                )
              : renderItem}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {maxSelected !== undefined && (
        <span id={limitId} hidden>
          {words.limit.replace("{max}", String(maxSelected))}
        </span>
      )}
    </div>
  );
}
