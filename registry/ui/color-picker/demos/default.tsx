import { ColorPicker } from "@/registry/ui/color-picker/color-picker";
import { Field, FieldDescription, FieldLabel } from "@/registry/ui/field/field";

export default function ColorPickerDefaultDemo() {
  return (
    <Field className="w-full max-w-72">
      <FieldLabel htmlFor="color-picker-demo-accent">Accent</FieldLabel>
      <ColorPicker
        id="color-picker-demo-accent"
        defaultValue="#e60012"
        name="accent"
        labels={{ trigger: "Accent" }}
        aria-describedby="color-picker-demo-accent-hint"
      />
      <FieldDescription id="color-picker-demo-accent-hint">
        The spot colour for stamps and errors.
      </FieldDescription>
    </Field>
  );
}
