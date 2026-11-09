import { InkFrame } from "@/components/ink-frame";
import { ScrollArea, ScrollBar } from "@/registry/ui/scroll-area/scroll-area";

const volumes = [
  { number: 1, title: "Paper Boats" },
  { number: 2, title: "Night Market" },
  { number: 3, title: "Two Umbrellas" },
  { number: 4, title: "Rooftop" },
  { number: 5, title: "Last Train" },
  { number: 6, title: "Ink Rain" },
];

export default function ScrollAreaHorizontalDemo() {
  return (
    <InkFrame className="w-full max-w-96 rounded-md p-1">
      <ScrollArea label="Volumes" className="rounded-md whitespace-nowrap">
        <div className="flex w-max gap-4 p-4">
          {volumes.map((volume) => (
            <figure key={volume.number} className="shrink-0">
              <InkFrame
                fill="tone"
                className="flex aspect-3/4 w-24 items-end rounded-sm p-2 font-display text-2xl text-ink"
              >
                {volume.number}
              </InkFrame>
              <figcaption className="pt-2 text-xs text-muted-foreground">
                Vol. {volume.number}{" "}
                <span className="font-semibold text-foreground">{volume.title}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </InkFrame>
  );
}
