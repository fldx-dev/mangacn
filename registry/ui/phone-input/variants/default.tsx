import { PhoneInput } from "@/registry/ui/phone-input/phone-input";

export default function PhoneInputDefaultVariant() {
  return (
    <PhoneInput
      aria-label="Phone"
      defaultCountry="JP"
      placeholder="03-1234-5678"
      className="max-w-sm"
    />
  );
}
