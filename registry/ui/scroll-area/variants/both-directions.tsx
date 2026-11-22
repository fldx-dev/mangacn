import { InkFrame } from "@/components/ink-frame";
import { ScrollArea, ScrollBar } from "@/registry/ui/scroll-area/scroll-area";

const pages = [1, 2, 3, 4];
const panels = [1, 2, 3, 4, 5, 6];

export default function ScrollAreaBothDirectionsVariant() {
  return (
    <InkFrame className="w-full max-w-96 rounded-md p-1">
      <ScrollArea label="Storyboard" className="h-72 rounded-md">
        <div className="grid w-max gap-4 p-4">
          {pages.map((page) => (
            <div key={page} className="grid gap-2">
              <p className="text-sm font-medium">Page {page}</p>
              <ol className="flex gap-3">
                {panels.map((panel) => (
                  <li key={panel}>
                    <InkFrame
                      fill={panel % 2 === 0 ? "tone" : "paper"}
                      className="flex h-20 w-28 items-end rounded-sm p-2 text-xs"
                    >
                      Panel {panel}
                    </InkFrame>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </InkFrame>
  );
}
