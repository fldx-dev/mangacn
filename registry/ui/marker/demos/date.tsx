import { Bubble, BubbleContent } from "@/registry/ui/bubble/bubble";
import { Marker, MarkerContent } from "@/registry/ui/marker/marker";

export default function MarkerDateDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Marker variant="separator">
        <MarkerContent>Yesterday</MarkerContent>
      </Marker>
      <Bubble variant="secondary">
        <BubbleContent>Deadline moved to Friday.</BubbleContent>
      </Bubble>
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <Bubble align="end">
        <BubbleContent>Then I can redraw the splash page.</BubbleContent>
      </Bubble>
    </div>
  );
}
