import { Textarea } from "@/registry/ui/textarea/textarea";

const states = [
  {
    id: "textarea-state-filled",
    label: "Filled",
    props: { defaultValue: "Panel 1: rain on the rooftop.\nPanel 2: a shadow lands." },
  },
  {
    id: "textarea-state-disabled",
    label: "Disabled",
    props: { disabled: true, defaultValue: "Editor notes are read-only." },
  },
  {
    id: "textarea-state-invalid",
    label: "Invalid",
    props: { "aria-invalid": true, defaultValue: "Too short" },
  },
] as const;

export default function TextareaStatesDemo() {
  return (
    <div className="grid w-full max-w-xs gap-4">
      {states.map(({ id, label, props }) => (
        <div key={id} className="grid gap-1.5">
          <label htmlFor={id} className="text-sm font-medium">
            {label}
          </label>
          <Textarea id={id} {...props} />
        </div>
      ))}
    </div>
  );
}
