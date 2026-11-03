import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/registry/ui/collapsible/collapsible";

// One open (−), one closed (+).
export default function CollapsibleGlyphDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Collapsible defaultOpen>
        <CollapsibleTrigger variant="glyph" className="w-full">
          Reading order
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 text-sm">
          Right to left, top to bottom (<span lang="ja">右から左へ</span>): the first panel is the
          one in the top right corner.
        </CollapsibleContent>
      </Collapsible>
      <Collapsible>
        <CollapsibleTrigger variant="glyph" className="w-full">
          Sound effects
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 text-sm">
          Drawn into the art, not lettered in balloons, and translated in small type beside them.
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
