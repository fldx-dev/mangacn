import { Switch } from "@/registry/ui/switch/switch";

const settings = [
  {
    id: "with-descriptions-chapters",
    label: "New chapters",
    description: "When a series you follow posts a chapter.",
    props: { defaultChecked: true },
  },
  {
    id: "with-descriptions-replies",
    label: "Replies",
    description: "When someone answers your comment.",
    props: {},
  },
  {
    id: "with-descriptions-deadlines",
    label: "Deadline reminders",
    description: "Only for creators with a series in production.",
    props: { disabled: true },
  },
] as const;

export default function SwitchWithDescriptionsVariant() {
  return (
    <div className="grid w-full max-w-sm gap-5">
      {settings.map(({ id, label, description, props }) => (
        <div key={id} className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <label htmlFor={id} className="text-sm font-medium">
              {label}
            </label>
            <p id={`${id}-text`} className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          <Switch id={id} aria-describedby={`${id}-text`} className="mt-0.5" {...props} />
        </div>
      ))}
    </div>
  );
}
