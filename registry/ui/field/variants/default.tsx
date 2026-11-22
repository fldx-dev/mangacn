import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/registry/ui/field/field";
import { Input } from "@/registry/ui/input/input";

export default function FieldDefaultVariant() {
  return (
    <form className="w-full max-w-sm">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-variant-title">Series title</FieldLabel>
          <Input id="field-variant-title" defaultValue="Kaiju Diner" />
          <FieldDescription>Shown on the cover and every chapter page.</FieldDescription>
        </Field>
        <Field data-invalid="true">
          <FieldLabel htmlFor="field-variant-pen-name" required>
            Pen name
          </FieldLabel>
          <Input
            id="field-variant-pen-name"
            defaultValue="K"
            required
            aria-invalid="true"
            aria-describedby="field-variant-pen-name-error"
          />
          <FieldError id="field-variant-pen-name-error">Use 3 letters or more.</FieldError>
        </Field>
      </FieldGroup>
    </form>
  );
}
