import { Button } from "@/registry/ui/button/button";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";
import { Switch } from "@/registry/ui/switch/switch";

/** Hero cell "A form": the field primitives with real labels, sized to the cell. */
export function HeroForm() {
  return (
    <div className="flex w-full flex-col gap-3 text-sm">
      <div className="grid gap-1.5">
        <label htmlFor="hero-email" className="font-medium">
          Email
        </label>
        <Input id="hero-email" type="email" placeholder="mangaka@example.com" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="hero-remember" defaultChecked />
        <label htmlFor="hero-remember">Remember me</label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="hero-chapters" />
        <label htmlFor="hero-chapters">New-chapter alerts</label>
      </div>
      <Button type="button" className="self-start">
        Sign in
      </Button>
    </div>
  );
}
