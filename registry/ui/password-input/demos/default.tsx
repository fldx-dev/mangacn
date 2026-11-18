import { Field, FieldGroup, FieldLabel } from "@/registry/ui/field/field";
import { Input } from "@/registry/ui/input/input";
import { PasswordInput } from "@/registry/ui/password-input/password-input";

export default function PasswordInputDefaultDemo() {
  return (
    <form className="w-full max-w-xs">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="password-input-email">Email</FieldLabel>
          <Input id="password-input-email" type="email" autoComplete="email" />
        </Field>
        <Field>
          <FieldLabel htmlFor="password-input-password">Password</FieldLabel>
          <PasswordInput
            id="password-input-password"
            name="password"
            autoComplete="current-password"
          />
        </Field>
      </FieldGroup>
    </form>
  );
}
