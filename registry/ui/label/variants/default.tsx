import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Label } from "@/registry/ui/label/label";

export default function LabelDefaultVariant() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="label-variant-terms" />
      <Label htmlFor="label-variant-terms">Accept the submission terms</Label>
    </div>
  );
}
