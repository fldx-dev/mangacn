import { Fragment } from "react";
import { InkFrame } from "@/components/ink-frame";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { Separator } from "@/registry/ui/separator/separator";

const chapters = Array.from({ length: 40 }, (_, index) => `Chapter ${40 - index}`);

export default function ScrollAreaDefaultDemo() {
  return (
    <InkFrame className="w-48 rounded-md p-1">
      <ScrollArea label="Chapters" className="h-64 rounded-md">
        <div className="p-4">
          <h4 className="mb-4 text-sm leading-none font-medium">Chapters</h4>
          {chapters.map((chapter) => (
            <Fragment key={chapter}>
              <div className="text-sm">{chapter}</div>
              <Separator className="my-2" />
            </Fragment>
          ))}
        </div>
      </ScrollArea>
    </InkFrame>
  );
}
