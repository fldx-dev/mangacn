import { RadioGroup, RadioGroupItem } from "@/registry/ui/radio-group/radio-group";

const qualities = [
  {
    value: "standard",
    label: "Standard",
    description: "Small files, fine for phones. About 40 MB a volume.",
  },
  {
    value: "high",
    label: "High",
    description: "Sharp screentones on tablets. About 120 MB a volume.",
  },
  {
    value: "original",
    label: "Original scans",
    description: "Full print resolution. About 600 MB a volume.",
  },
];

export default function RadioGroupWithDescriptionsVariant() {
  return (
    <RadioGroup defaultValue="high" aria-label="Download quality" className="w-full max-w-xs gap-4">
      {qualities.map(({ value, label, description }) => (
        <div key={value} className="flex items-start gap-3">
          <RadioGroupItem
            id={`with-descriptions-${value}`}
            value={value}
            aria-describedby={`with-descriptions-${value}-text`}
            className="mt-0.5"
          />
          <div className="grid gap-1">
            <label htmlFor={`with-descriptions-${value}`} className="text-sm font-medium">
              {label}
            </label>
            <p id={`with-descriptions-${value}-text`} className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      ))}
    </RadioGroup>
  );
}
