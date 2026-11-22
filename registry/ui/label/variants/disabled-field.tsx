import { Input } from "@/registry/ui/input/input";
import { Label } from "@/registry/ui/label/label";

export default function LabelDisabledFieldVariant() {
  return (
    <div className="grid w-full max-w-64 gap-5">
      <div className="grid gap-2">
        <Label htmlFor="disabled-field-title">Chapter title</Label>
        <Input id="disabled-field-title" defaultValue="The rooftop showdown" />
      </div>
      {/* `data-disabled` on a `group` wrapper dims the label along with its locked input. */}
      <div className="group grid gap-2" data-disabled="true">
        <Label htmlFor="disabled-field-release">Release date</Label>
        <Input id="disabled-field-release" defaultValue="Nov 25" disabled />
      </div>
    </div>
  );
}
