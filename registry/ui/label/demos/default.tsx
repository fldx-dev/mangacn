import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Label } from "@/registry/ui/label/label";

export default function LabelDefaultDemo() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="label-demo-terms" />
      <Label htmlFor="label-demo-terms">Accept the submission terms</Label>
    </div>
  );
}
