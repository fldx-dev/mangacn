import { Button } from "@/registry/ui/button/button";
import { Spinner } from "@/registry/ui/spinner/spinner";

export default function SpinnerButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button disabled size="sm">
        <Spinner data-icon="inline-start" />
        Saving
      </Button>
      <Button variant="outline" disabled size="sm">
        <Spinner data-icon="inline-start" />
        Uploading pages
      </Button>
    </div>
  );
}
