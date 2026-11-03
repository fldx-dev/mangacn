import { Bold, Italic, Underline } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/registry/ui/toggle-group/toggle-group";

export default function ToggleGroupMultipleDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <ToggleGroup aria-label="Lettering style" multiple defaultValue={["bold"]}>
        <ToggleGroupItem value="bold" aria-label="Bold">
          <Bold />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          <Italic />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline">
          <Underline />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        aria-label="Layers"
        variant="outline"
        size="sm"
        multiple
        defaultValue={["inks", "letters"]}
      >
        <ToggleGroupItem value="pencils">Pencils</ToggleGroupItem>
        <ToggleGroupItem value="inks">Inks</ToggleGroupItem>
        <ToggleGroupItem value="letters">Letters</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
