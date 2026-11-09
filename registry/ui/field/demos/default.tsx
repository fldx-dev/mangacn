import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/registry/ui/field/field";
import { Input } from "@/registry/ui/input/input";

export default function FieldDefaultDemo() {
  return (
    <form className="w-full max-w-sm">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-demo-title">Series title</FieldLabel>
          <Input id="field-demo-title" defaultValue="Kaiju Diner" />
          <FieldDescription>Shown on the cover and every chapter page.</FieldDescription>
        </Field>
        <Field data-invalid="true">
          <FieldLabel htmlFor="field-demo-pen-name" required>
            Pen name
          </FieldLabel>
          <Input
            id="field-demo-pen-name"
            defaultValue="K"
            required
            aria-invalid="true"
            aria-describedby="field-demo-pen-name-error"
          />
          <FieldError id="field-demo-pen-name-error">Use 3 letters or more.</FieldError>
        </Field>
      </FieldGroup>
    </form>
  );
}
