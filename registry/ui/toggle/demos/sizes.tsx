import { Toggle } from "@/registry/ui/toggle/toggle";

const sizes = [
  { size: "sm", label: "Small" },
  { size: "default", label: "Default" },
  { size: "lg", label: "Large" },
] as const;

export default function ToggleSizesDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {sizes.map(({ size, label }) => (
        <Toggle key={size} variant="outline" size={size} defaultPressed={size === "default"}>
          {label}
        </Toggle>
      ))}
    </div>
  );
}
