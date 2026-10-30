import { Switch } from "@/registry/ui/switch/switch";

export default function SwitchDefaultDemo() {
  return (
    <div className="flex items-center gap-2">
      <Switch id="switch-demo-tone" defaultChecked />
      <label htmlFor="switch-demo-tone" className="text-sm">
        Screentone overlay
      </label>
    </div>
  );
}
