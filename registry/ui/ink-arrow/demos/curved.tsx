import { Button } from "@/registry/ui/button/button";
import { InkArrow } from "@/registry/ui/ink-arrow/ink-arrow";

export default function InkArrowCurvedDemo() {
  return (
    <div className="flex items-center gap-1">
      <InkArrow curve="right" color="spot" label="Start here" className="text-sm" />
      <Button>Read chapter 1</Button>
    </div>
  );
}
