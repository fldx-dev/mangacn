import { Button } from "@/registry/ui/button/button";

const variants = [
  { variant: "default", label: "Default" },
  { variant: "outline", label: "Outline" },
  { variant: "secondary", label: "Secondary" },
  { variant: "ghost", label: "Ghost" },
  { variant: "destructive", label: "Destructive" },
  { variant: "link", label: "Link" },
  { variant: "sfx", label: "Dokan!" },
] as const;

export default function ButtonVariantsDemo() {
  return (
    <div className="flex max-w-md flex-col items-center gap-6">
      <div className="flex flex-wrap justify-center gap-3">
        {variants.map(({ variant, label }) => (
          <Button key={variant} variant={variant}>
            {label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>
          Disabled
        </Button>
        <Button variant="sfx" disabled>
          Disabled
        </Button>
      </div>
    </div>
  );
}
