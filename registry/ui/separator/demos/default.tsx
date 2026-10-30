import { Separator } from "@/registry/ui/separator/separator";

export default function SeparatorDefaultDemo() {
  return (
    <div className="w-full max-w-xs">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Chapter 12</p>
        <p className="text-sm text-muted-foreground">The rooftop showdown.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-4 text-sm">
        <span>Read</span>
        <Separator orientation="vertical" />
        <span>Bookmark</span>
        <Separator orientation="vertical" />
        <span>Share</span>
      </div>
    </div>
  );
}
