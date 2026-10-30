import { Checkbox } from "@/registry/ui/checkbox/checkbox";

export default function CheckboxDefaultDemo() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-demo-notify" defaultChecked />
      <label htmlFor="checkbox-demo-notify" className="text-sm">
        Notify me when the next chapter drops
      </label>
    </div>
  );
}
