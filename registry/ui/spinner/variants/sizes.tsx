import { Spinner } from "@/registry/ui/spinner/spinner";

export default function SpinnerSizesVariant() {
  return (
    <div className="flex items-center gap-6">
      <Spinner />
      <Spinner className="size-5" />
      <Spinner className="size-6" />
    </div>
  );
}
