import { ColorPicker } from "@/registry/ui/color-picker/color-picker";
import { Field, FieldDescription, FieldLabel } from "@/registry/ui/field/field";

export default function ColorPickerDefaultVariant() {
  return (
    <Field className="w-full max-w-72">
      <FieldLabel htmlFor="color-picker-variant-accent">Accent</FieldLabel>
      <ColorPicker
        id="color-picker-variant-accent"
        defaultValue="#e60012"
        name="accent"
        labels={{ trigger: "Accent" }}
        aria-describedby="color-picker-variant-accent-hint"
      />
      <FieldDescription id="color-picker-variant-accent-hint">
        The spot colour for stamps and errors.
      </FieldDescription>
    </Field>
  );
}
