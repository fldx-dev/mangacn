"use client";

import { CheckIcon, XIcon } from "lucide-react";
import * as React from "react";
import { Field, FieldLabel } from "@/registry/ui/field/field";
import { PasswordInput } from "@/registry/ui/password-input/password-input";

const rules = [
  { text: "At least 12 characters", test: (value: string) => value.length >= 12 },
  { text: "A capital letter", test: (value: string) => /[A-Z]/.test(value) },
  { text: "A digit or a symbol", test: (value: string) => /[^A-Za-z]/.test(value) },
];

export default function PasswordInputRequirementsVariant() {
  const [password, setPassword] = React.useState("Kaiju-diner");

  return (
    <form className="w-full max-w-xs">
      <Field>
        <FieldLabel htmlFor="password-input-studio">New studio password</FieldLabel>
        <PasswordInput
          id="password-input-studio"
          name="new-password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="password-input-studio-rules"
        />
        <ul
          id="password-input-studio-rules"
          aria-live="polite"
          className="flex flex-col gap-1 text-sm"
        >
          {rules.map((rule) => {
            const met = rule.test(password);
            return (
              <li
                key={rule.text}
                className={
                  met ? "flex items-center gap-2" : "flex items-center gap-2 text-muted-foreground"
                }
              >
                {met ? (
                  <CheckIcon aria-hidden="true" className="size-4 shrink-0" />
                ) : (
                  <XIcon aria-hidden="true" className="size-4 shrink-0" />
                )}
                <span>
                  {rule.text}
                  <span className="sr-only">{met ? " (done)" : " (missing)"}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Field>
    </form>
  );
}
