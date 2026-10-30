import { RadioGroup, RadioGroupItem } from "@/registry/ui/radio-group/radio-group";

const groups = [
  {
    label: "Enabled",
    defaultValue: "checked",
    items: [
      { value: "unchecked", label: "Unchecked", props: {} },
      { value: "checked", label: "Checked", props: {} },
      { value: "invalid", label: "Invalid", props: { "aria-invalid": true } },
    ],
  },
  {
    label: "Disabled",
    defaultValue: "disabled-checked",
    items: [
      { value: "disabled", label: "Disabled", props: { disabled: true } },
      { value: "disabled-checked", label: "Disabled, checked", props: { disabled: true } },
    ],
  },
] as const;

export default function RadioGroupStatesDemo() {
  return (
    <div className="grid gap-6">
      {groups.map((group) => (
        <RadioGroup
          key={group.label}
          defaultValue={group.defaultValue}
          aria-label={group.label}
          className="w-fit"
        >
          {group.items.map(({ value, label, props }) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem id={`radio-state-${value}`} value={value} {...props} />
              <label htmlFor={`radio-state-${value}`} className="text-sm">
                {label}
              </label>
            </div>
          ))}
        </RadioGroup>
      ))}
    </div>
  );
}
