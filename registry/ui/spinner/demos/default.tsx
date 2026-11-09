import { Spinner } from "@/registry/ui/spinner/spinner";

export default function SpinnerDefaultDemo() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Spinner />
      <span>Inking page 3…</span>
    </div>
  );
}
