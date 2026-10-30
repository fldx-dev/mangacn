import { Badge } from "@/registry/ui/badge/badge";

const variants = [
  { variant: "default", label: "Default" },
  { variant: "secondary", label: "Secondary" },
  { variant: "outline", label: "Outline" },
  { variant: "destructive", label: "Destructive" },
  { variant: "ghost", label: "Ghost" },
  { variant: "link", label: "Link" },
  { variant: "spot", label: "Spot" },
] as const;

export default function BadgeVariantsDemo() {
  return (
    <div className="flex max-w-sm flex-wrap justify-center gap-3">
      {variants.map(({ variant, label }) => (
        <Badge key={variant} variant={variant}>
          {label}
        </Badge>
      ))}
    </div>
  );
}
