import { Switch } from "@/registry/ui/switch/switch";

export default function SwitchDefaultVariant() {
  return (
    <div className="flex items-center gap-2">
      <Switch id="switch-variant-tone" defaultChecked />
      <label htmlFor="switch-variant-tone" className="text-sm">
        Screentone overlay
      </label>
    </div>
  );
}
