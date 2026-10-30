import { Checkbox } from "@/registry/ui/checkbox/checkbox";

const states = [
  { id: "checkbox-state-unchecked", label: "Unchecked", props: {} },
  { id: "checkbox-state-checked", label: "Checked", props: { defaultChecked: true } },
  { id: "checkbox-state-disabled", label: "Disabled", props: { disabled: true } },
  {
    id: "checkbox-state-disabled-checked",
    label: "Disabled, checked",
    props: { disabled: true, defaultChecked: true },
  },
  { id: "checkbox-state-invalid", label: "Invalid", props: { "aria-invalid": true } },
] as const;

export default function CheckboxStatesDemo() {
  return (
    <div className="grid gap-3">
      {states.map(({ id, label, props }) => (
        <div key={id} className="flex items-center gap-2">
          <Checkbox id={id} {...props} />
          <label htmlFor={id} className="text-sm">
            {label}
          </label>
        </div>
      ))}
    </div>
  );
}
