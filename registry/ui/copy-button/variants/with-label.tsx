import { CopyButton } from "@/registry/ui/copy-button/copy-button";

const command = "npx shadcn@latest add @mangacn/copy-button";

export default function CopyButtonWithLabelVariant() {
  return (
    <div className="flex w-full max-w-md flex-wrap items-center gap-2">
      <code className="min-w-0 flex-1 truncate font-mono text-sm">{command}</code>
      <CopyButton value={command} variant="outline" size="sm">
        Copy
      </CopyButton>
    </div>
  );
}
