import { Field, FieldDescription, FieldLabel } from "@/registry/ui/field/field";
import { NumberInput } from "@/registry/ui/number-input/number-input";

export default function NumberInputFieldDemo() {
  return (
    <form className="w-full max-w-xs">
      <Field>
        <FieldLabel htmlFor="number-input-copies">Copies per order</FieldLabel>
        <NumberInput
          id="number-input-copies"
          name="copies"
          defaultValue={1}
          min={1}
          max={99}
          aria-describedby="number-input-copies-description"
        />
        <FieldDescription id="number-input-copies-description">
          From 1 to 99 copies of each volume.
        </FieldDescription>
      </Field>
    </form>
  );
}
