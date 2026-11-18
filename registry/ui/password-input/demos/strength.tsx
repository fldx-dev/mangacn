import { Field, FieldDescription, FieldLabel } from "@/registry/ui/field/field";
import { PasswordInput } from "@/registry/ui/password-input/password-input";

export default function PasswordInputStrengthDemo() {
  return (
    <form className="w-full max-w-xs">
      <Field>
        <FieldLabel htmlFor="password-input-new">Choose a password</FieldLabel>
        <PasswordInput
          id="password-input-new"
          name="new-password"
          autoComplete="new-password"
          defaultValue="kaiju-diner"
          showStrength
          aria-describedby="password-input-new-description"
        />
        <FieldDescription id="password-input-new-description">
          12 characters or more, with capitals, digits or symbols.
        </FieldDescription>
      </Field>
    </form>
  );
}
