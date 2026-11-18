import { NumberInput } from "@/registry/ui/number-input/number-input";

export default function NumberInputDefaultDemo() {
  return (
    <div className="w-full max-w-48">
      <NumberInput aria-label="Chapter" defaultValue={12} min={1} />
    </div>
  );
}
