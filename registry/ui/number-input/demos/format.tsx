import { Field, FieldGroup, FieldLabel } from "@/registry/ui/field/field";
import { NumberInput } from "@/registry/ui/number-input/number-input";

export default function NumberInputFormatDemo() {
  return (
    <FieldGroup className="w-full max-w-xs">
      <Field>
        <FieldLabel htmlFor="number-input-price">Price per volume</FieldLabel>
        <NumberInput
          id="number-input-price"
          defaultValue={680}
          min={0}
          step={10}
          largeStep={100}
          locale="ja-JP"
          format={{ style: "currency", currency: "JPY" }}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="number-input-discount">Discount</FieldLabel>
        <NumberInput
          id="number-input-discount"
          defaultValue={0.15}
          min={0}
          max={1}
          step={0.05}
          largeStep={0.1}
          format={{ style: "percent" }}
        />
      </Field>
    </FieldGroup>
  );
}
