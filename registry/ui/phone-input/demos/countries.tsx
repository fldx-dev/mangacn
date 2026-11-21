import { PhoneInput } from "@/registry/ui/phone-input/phone-input";

export default function PhoneInputCountriesDemo() {
  return (
    <PhoneInput
      aria-label="Studio phone"
      countries={["JP", "KR", "TW", "FR", "US"]}
      defaultValue="+33142685300"
      className="max-w-sm"
    />
  );
}
