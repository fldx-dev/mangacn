import { NativeSelect, NativeSelectOption } from "@/registry/ui/native-select/native-select";

const states = [
  { label: "Selected", props: {} },
  { label: "Small", props: { size: "sm" } },
  { label: "Disabled", props: { disabled: true } },
  { label: "Invalid", props: { "aria-invalid": true } },
] as const;

export default function NativeSelectStatesDemo() {
  return (
    <div className="grid w-full max-w-48 gap-3">
      {states.map(({ label, props }) => (
        <NativeSelect
          key={label}
          aria-label={label}
          defaultValue="seinen"
          className="w-full"
          {...props}
        >
          <NativeSelectOption value="shonen">Shōnen</NativeSelectOption>
          <NativeSelectOption value="seinen">Seinen</NativeSelectOption>
        </NativeSelect>
      ))}
    </div>
  );
}
