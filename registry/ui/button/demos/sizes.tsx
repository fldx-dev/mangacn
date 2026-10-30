import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { Button } from "@/registry/ui/button/button";

export default function ButtonSizesDemo() {
  return (
    <div className="flex max-w-md flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">
          Next page
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="icon-xs" variant="outline" aria-label="Add panel">
          <PlusIcon />
        </Button>
        <Button size="icon-sm" variant="outline" aria-label="Add panel">
          <PlusIcon />
        </Button>
        <Button size="icon" variant="outline" aria-label="Add panel">
          <PlusIcon />
        </Button>
        <Button size="icon-lg" variant="outline" aria-label="Add panel">
          <PlusIcon />
        </Button>
      </div>
    </div>
  );
}
