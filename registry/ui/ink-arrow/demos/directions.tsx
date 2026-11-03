import { InkArrow } from "@/registry/ui/ink-arrow/ink-arrow";

export default function InkArrowDirectionsDemo() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-6">
        <InkArrow direction="up" />
        <InkArrow direction="down" />
        <InkArrow direction="left" />
        <InkArrow direction="right" />
      </div>
      <div className="flex items-center gap-6">
        <InkArrow length="sm" />
        <InkArrow length="md" />
        <InkArrow length="lg" />
      </div>
    </div>
  );
}
