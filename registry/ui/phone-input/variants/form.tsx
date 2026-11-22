"use client";

import * as React from "react";
import { Button } from "@/registry/ui/button/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/ui/field/field";
import { isValidPhoneNumber, PhoneInput } from "@/registry/ui/phone-input/phone-input";

export default function PhoneInputFormVariant() {
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const phone = String(new FormData(event.currentTarget).get("phone") ?? "");
    const problem = !phone
      ? "Enter a phone number."
      : !isValidPhoneNumber(phone)
        ? "Enter the whole number for the country."
        : null;
    setError(problem);
    setSent(problem ? "" : `Sent ${phone}.`);
  };

  return (
    <form noValidate onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4">
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="phone-input-form">Phone for delivery</FieldLabel>
        <PhoneInput
          id="phone-input-form"
          name="phone"
          defaultCountry="JP"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "phone-input-form-error" : "phone-input-form-hint"}
          onValueChange={() => setError(null)}
        />
        {error ? (
          <FieldError id="phone-input-form-error">{error}</FieldError>
        ) : (
          <FieldDescription id="phone-input-form-hint">
            The courier calls this number on the day.
          </FieldDescription>
        )}
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Save</Button>
        <p role="status" className="text-sm text-muted-foreground">
          {sent}
        </p>
      </div>
    </form>
  );
}
