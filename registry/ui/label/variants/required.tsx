import { Input } from "@/registry/ui/input/input";
import { Label } from "@/registry/ui/label/label";

export default function LabelRequiredVariant() {
  return (
    <div className="grid w-full max-w-64 gap-2">
      <Label htmlFor="label-variant-pen-name" required>
        Pen name
      </Label>
      <Input id="label-variant-pen-name" placeholder="Mizuki Ren" required />
    </div>
  );
}
