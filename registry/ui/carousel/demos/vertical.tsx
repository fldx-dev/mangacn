import { InkFrame } from "@/components/ink-frame";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/registry/ui/carousel/carousel";

const lines = ["Where were you?", "On the roof.", "In this rain?", "Watching the trains."];

export default function CarouselVerticalDemo() {
  return (
    <div className="py-12">
      <Carousel
        orientation="vertical"
        opts={{ align: "start" }}
        className="w-full max-w-xs"
        aria-label="Dialogue"
      >
        <CarouselContent className="-mt-1 h-48">
          {lines.map((line) => (
            <CarouselItem key={line} className="basis-1/2 pt-1">
              <div className="p-1.5">
                <InkFrame className="flex items-center justify-center rounded-lg p-6">
                  <span className="text-lg font-semibold">{line}</span>
                </InkFrame>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
