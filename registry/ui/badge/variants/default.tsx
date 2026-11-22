import { Badge } from "@/registry/ui/badge/badge";

export default function BadgeDefaultVariant() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Badge>New</Badge>
      <Badge variant="outline">Ch. 12</Badge>
      <Badge variant="secondary" lang="ja">
        完結
      </Badge>
    </div>
  );
}
