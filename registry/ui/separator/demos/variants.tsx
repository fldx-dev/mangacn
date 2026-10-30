import { Separator } from "@/registry/ui/separator/separator";

export default function SeparatorVariantsDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-6 text-sm">
      <div className="flex flex-col gap-3">
        <span>Horizontal</span>
        <Separator />
      </div>
      <div className="flex h-16 items-center gap-4">
        <span>Vertical</span>
        <Separator orientation="vertical" />
        <span>Panel break</span>
      </div>
    </div>
  );
}
