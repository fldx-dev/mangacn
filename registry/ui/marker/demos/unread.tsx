import { Bubble, BubbleContent, BubbleGroup } from "@/registry/ui/bubble/bubble";
import { Marker, MarkerContent } from "@/registry/ui/marker/marker";

export default function MarkerUnreadDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Bubble align="end">
        <BubbleContent>Going offline to ink. Back at six.</BubbleContent>
      </Bubble>
      {/* The surface's one spot: the stroke and the label turn spot. */}
      <Marker variant="separator" className="text-spot [--ink:var(--spot)]">
        <MarkerContent>2 new messages</MarkerContent>
      </Marker>
      <BubbleGroup>
        <Bubble variant="secondary">
          <BubbleContent>The printer called.</BubbleContent>
        </Bubble>
        <Bubble variant="secondary">
          <BubbleContent>They need the cover by noon tomorrow.</BubbleContent>
        </Bubble>
      </BubbleGroup>
    </div>
  );
}
