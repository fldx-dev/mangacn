import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/registry/ui/carousel/carousel";
import { MangaFrame } from "@/registry/ui/manga-frame/manga-frame";

/** A grey scene as an inline SVG, so the demo needs no files: hills, a moon or a sun. */
function scene(sky: string, body: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
<rect width="400" height="300" fill="${sky}"/>${body}
<path d="M0 230 Q100 180 200 225 T400 215 L400 300 L0 300 Z" fill="#555"/>
<path d="M0 265 L400 255 L400 300 L0 300 Z" fill="#222"/>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const panels = [
  {
    src: scene(
      "#ededed",
      `<circle cx="300" cy="80" r="40" fill="#fafafa" stroke="#222" stroke-width="3"/>`,
    ),
    alt: "Hills under a pale moon",
    caption: "Night falls on the pass.",
  },
  {
    src: scene(
      "#d6d6d6",
      `<circle cx="90" cy="110" r="52" fill="#fafafa" stroke="#222" stroke-width="3"/>`,
    ),
    alt: "Hills under a low sun",
    caption: "Dawn, three days later.",
  },
  {
    src: scene(
      "#f4f4f4",
      `<g stroke="#222" stroke-width="2"><line x1="40" y1="30" x2="90" y2="80"/><line x1="120" y1="20" x2="170" y2="70"/><line x1="220" y1="30" x2="270" y2="80"/></g>`,
    ),
    alt: "Hills in driving rain",
    caption: "The storm reaches the valley.",
  },
];

export default function CarouselMangaFramesDemo() {
  return (
    <div className="px-12">
      <Carousel className="w-full max-w-56 sm:max-w-sm" aria-label="Chapter 3 panels">
        <CarouselContent>
          {panels.map((panel) => (
            <CarouselItem key={panel.caption}>
              {/* Room for the pen: the viewport clips what the outline draws past its box. */}
              <div className="p-1.5">
                <MangaFrame src={panel.src} alt={panel.alt} caption={panel.caption} />
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
