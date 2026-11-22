import { CheckIcon, LockIcon, MessageSquareIcon } from "lucide-react";
import { Badge } from "@/registry/ui/badge/badge";

export default function BadgeChapterListVariant() {
  return (
    <ul className="grid w-full max-w-sm gap-3">
      <li className="flex flex-wrap items-center gap-2">
        <span className="me-auto text-sm font-medium">Ch. 48: Night market</span>
        <Badge>New</Badge>
        <Badge variant="outline" render={<a href="#chapter-48-comments" />}>
          <MessageSquareIcon data-icon="inline-start" aria-hidden />
          24<span className="sr-only"> comments</span>
        </Badge>
      </li>
      <li className="flex flex-wrap items-center gap-2">
        <span className="me-auto text-sm font-medium">Ch. 47: The ferry</span>
        <Badge variant="outline">
          <LockIcon data-icon="inline-start" aria-hidden />
          Early access
        </Badge>
      </li>
      <li className="flex flex-wrap items-center gap-2">
        <span className="me-auto text-sm text-muted-foreground">Ch. 46: Two umbrellas</span>
        <Badge variant="secondary">
          <CheckIcon data-icon="inline-start" aria-hidden />
          Read
        </Badge>
      </li>
    </ul>
  );
}
