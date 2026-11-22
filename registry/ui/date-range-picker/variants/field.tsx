"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/registry/ui/button/button";
import { DateRangePicker } from "@/registry/ui/date-range-picker/date-range-picker";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/ui/field/field";

export default function DateRangePickerFieldVariant() {
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [submitted, setSubmitted] = React.useState(false);
  const missing = submitted && !range?.to;
  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <Field data-invalid={missing || undefined}>
        <FieldLabel id="booth-dates-label" htmlFor="booth-dates">
          Convention booth dates
        </FieldLabel>
        <DateRangePicker
          id="booth-dates"
          name="booth"
          aria-labelledby="booth-dates-label"
          aria-invalid={missing || undefined}
          aria-describedby={missing ? "booth-dates-hint booth-dates-error" : "booth-dates-hint"}
          value={range}
          onValueChange={setRange}
          calendarProps={{ defaultMonth: new Date(2026, 7, 1) }}
        />
        <FieldDescription id="booth-dates-hint">
          The first and last day your table is staffed.
        </FieldDescription>
        {missing && <FieldError id="booth-dates-error">Pick a first and a last day.</FieldError>}
      </Field>
      <Button type="submit" className="self-start">
        Book the booth
      </Button>
    </form>
  );
}
