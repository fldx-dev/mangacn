import { Input } from "@/registry/ui/input/input";

const states = [
  { id: "input-state-empty", label: "Empty", props: { placeholder: "Chapter title" } },
  { id: "input-state-filled", label: "Filled", props: { defaultValue: "The rooftop showdown" } },
  {
    id: "input-state-disabled",
    label: "Disabled",
    props: { disabled: true, defaultValue: "Locked until Friday" },
  },
  {
    id: "input-state-invalid",
    label: "Invalid",
    props: { "aria-invalid": true, defaultValue: "mangaka@" },
  },
] as const;

export default function InputStatesDemo() {
  return (
    <div className="grid w-full max-w-xs gap-4">
      {states.map(({ id, label, props }) => (
        <div key={id} className="grid gap-1.5">
          <label htmlFor={id} className="text-sm font-medium">
            {label}
          </label>
          <Input id={id} {...props} />
        </div>
      ))}
      <div className="grid gap-1.5">
        <label htmlFor="input-state-file" className="text-sm font-medium">
          Cover art
        </label>
        <Input id="input-state-file" type="file" />
      </div>
    </div>
  );
}
