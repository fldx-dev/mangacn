import { Bookmark } from "lucide-react";
import { Toggle } from "@/registry/ui/toggle/toggle";

export default function ToggleOutlineDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Toggle variant="outline">Spread view</Toggle>
      <Toggle variant="outline" defaultPressed>
        Right to left
      </Toggle>
      <Toggle variant="outline" aria-label="Bookmark this page" defaultPressed>
        <Bookmark />
      </Toggle>
      <Toggle variant="outline" disabled>
        Colour pages
      </Toggle>
    </div>
  );
}
