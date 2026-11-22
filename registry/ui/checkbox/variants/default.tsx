import { Checkbox } from "@/registry/ui/checkbox/checkbox";

export default function CheckboxDefaultVariant() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-variant-notify" defaultChecked />
      <label htmlFor="checkbox-variant-notify" className="text-sm">
        Notify me when the next chapter drops
      </label>
    </div>
  );
}
