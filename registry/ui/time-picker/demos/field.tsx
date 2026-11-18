"use client";

import * as React from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/ui/field/field";
import { TimePicker } from "@/registry/ui/time-picker/time-picker";

export default function TimePickerFieldDemo() {
  const [value, setValue] = React.useState<string | null>("21:30");
  const late = value !== null && (value < "09:00" || value > "21:00");
  return (
    <Field data-invalid={late || undefined} className="w-full max-w-xs">
      <FieldLabel id="release-time-label" htmlFor="release-time">
        Chapter release time
      </FieldLabel>
      {/* A vertical field stretches its controls; the wrapper keeps the picker at its 9rem. */}
      <div>
        <TimePicker
          id="release-time"
          aria-labelledby="release-time-label"
          aria-describedby={late ? "release-time-hint release-time-error" : "release-time-hint"}
          value={value}
          onValueChange={setValue}
          min="09:00"
          max="21:00"
          minuteStep={15}
          name="release"
        />
      </div>
      <FieldDescription id="release-time-hint">
        Between 09:00 and 21:00, on the quarter hour.
      </FieldDescription>
      {late && (
        <FieldError id="release-time-error">Pick a time between 09:00 and 21:00.</FieldError>
      )}
    </Field>
  );
}
