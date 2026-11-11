import { InkFrame } from "@/components/ink-frame";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/registry/ui/carousel/carousel";

const pages = [1, 2, 3, 4, 5];

export default function CarouselDefaultDemo() {
  return (
    <div className="px-12">
      <Carousel className="w-full max-w-48 sm:max-w-56" aria-label="Pages">
        <CarouselContent>
          {pages.map((page) => (
            <CarouselItem key={page}>
              {/* Room for the pen: the viewport clips what the outline draws past its box. */}
              <div className="p-1.5">
                <InkFrame className="flex aspect-square items-center justify-center rounded-lg p-6">
                  <span className="font-display text-4xl">{page}</span>
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
