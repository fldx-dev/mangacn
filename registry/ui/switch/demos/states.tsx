import { Switch } from "@/registry/ui/switch/switch";

const states = [
  { id: "switch-state-off", label: "Off", props: {} },
  { id: "switch-state-on", label: "On", props: { defaultChecked: true } },
  { id: "switch-state-small", label: "Small, on", props: { size: "sm", defaultChecked: true } },
  { id: "switch-state-disabled", label: "Disabled", props: { disabled: true } },
  {
    id: "switch-state-disabled-on",
    label: "Disabled, on",
    props: { disabled: true, defaultChecked: true },
  },
  { id: "switch-state-invalid", label: "Invalid", props: { "aria-invalid": true } },
] as const;

export default function SwitchStatesDemo() {
  return (
    <div className="grid gap-3">
      {states.map(({ id, label, props }) => (
        <div key={id} className="flex items-center gap-2">
          <Switch id={id} {...props} />
          <label htmlFor={id} className="text-sm">
            {label}
          </label>
        </div>
      ))}
    </div>
  );
}
