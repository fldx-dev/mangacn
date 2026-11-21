import { Field, FieldDescription, FieldLabel } from "@/registry/ui/field/field";
import { PhoneInput } from "@/registry/ui/phone-input/phone-input";

export default function PhoneInputDefaultDemo() {
  return (
    <Field className="w-full max-w-sm">
      <FieldLabel htmlFor="phone-input-demo">Phone</FieldLabel>
      <PhoneInput
        id="phone-input-demo"
        defaultCountry="JP"
        placeholder="03-1234-5678"
        aria-describedby="phone-input-demo-hint"
      />
      <FieldDescription id="phone-input-demo-hint">
        The editors call when a proof is ready.
      </FieldDescription>
    </Field>
  );
}
