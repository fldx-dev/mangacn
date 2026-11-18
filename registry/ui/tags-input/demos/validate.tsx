"use client";

import { Field, FieldDescription, FieldLabel } from "@/registry/ui/field/field";
import { TagsInput } from "@/registry/ui/tags-input/tags-input";

const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TagsInputValidateDemo() {
  return (
    <Field className="w-full max-w-sm">
      <FieldLabel htmlFor="tags-input-invite">Invite editors</FieldLabel>
      <TagsInput
        id="tags-input-invite"
        name="editors"
        max={5}
        defaultValue={["aoi@kaiju-diner.jp", "ren@kaiju-diner.jp"]}
        placeholder="name@example.com"
        validate={(tag) => email.test(tag) || `${tag} is not an email address`}
        aria-describedby="tags-input-invite-description"
      />
      <FieldDescription id="tags-input-invite-description">
        Up to 5 addresses. Paste a list separated by commas.
      </FieldDescription>
    </Field>
  );
}
