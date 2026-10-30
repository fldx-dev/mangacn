import { RadioGroup, RadioGroupItem } from "@/registry/ui/radio-group/radio-group";

const directions = [
  { value: "rtl", label: "Right to left (manga)" },
  { value: "ltr", label: "Left to right" },
  { value: "vertical", label: "Vertical scroll" },
];

export default function RadioGroupDefaultDemo() {
  return (
    <RadioGroup defaultValue="rtl" aria-label="Reading direction" className="w-fit">
      {directions.map(({ value, label }) => (
        <div key={value} className="flex items-center gap-2">
          <RadioGroupItem id={`radio-demo-${value}`} value={value} />
          <label htmlFor={`radio-demo-${value}`} className="text-sm">
            {label}
          </label>
        </div>
      ))}
    </RadioGroup>
  );
}
