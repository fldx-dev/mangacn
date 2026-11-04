import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/registry/ui/hover-card/hover-card";

export default function HoverCardDefaultDemo() {
  return (
    <p className="text-sm">
      Story and art by{" "}
      <HoverCard defaultOpen>
        <HoverCardTrigger href="#author" className="font-medium underline underline-offset-4">
          Aoi Takahashi
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="grid gap-1">
            <p className="font-medium">Aoi Takahashi</p>
            <p className="text-muted-foreground">
              Draws rooftop chases and quiet train rides. Three series, one of them finished.
            </p>
            <p className="text-xs text-muted-foreground">Joined March 2021</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    </p>
  );
}
