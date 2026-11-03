import { Languages, Volume2 } from "lucide-react";
import { Toggle } from "@/registry/ui/toggle/toggle";

export default function ToggleDefaultDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Toggle defaultPressed>
        <Languages data-icon="inline-start" />
        Furigana
      </Toggle>
      <Toggle>
        <Volume2 data-icon="inline-start" />
        SFX notes
      </Toggle>
    </div>
  );
}
