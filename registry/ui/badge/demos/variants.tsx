import { Badge } from "@/registry/ui/badge/badge";

const variants = [
  { variant: "default", label: "New" },
  { variant: "secondary", label: "Ch. 12" },
  { variant: "outline", label: "Vol. 3" },
  { variant: "destructive", label: "Hiatus" },
  { variant: "ghost", label: "Draft" },
  { variant: "link", label: "Read on" },
  { variant: "spot", label: "Hot" },
] as const;

export default function BadgeVariantsDemo() {
  return (
    <div className="flex max-w-sm flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-3">
        {variants.map(({ variant, label }) => (
          <Badge key={variant} variant={variant}>
            {label}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Badge lang="ja">完結</Badge>
        <Badge variant="secondary" lang="ja">
          連載中
        </Badge>
        <Badge variant="spot" lang="ja">
          新連載
        </Badge>
      </div>
    </div>
  );
}
