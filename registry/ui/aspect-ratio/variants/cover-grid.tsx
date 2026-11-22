import { InkFrame } from "@/components/ink-frame";
import { AspectRatio } from "@/registry/ui/aspect-ratio/aspect-ratio";

const volumes = [
  { number: 1, title: "Night Market", fill: "tone" },
  { number: 2, title: "The Ferry", fill: "hatch" },
  { number: 3, title: "Two Umbrellas", fill: "tone" },
  { number: 4, title: "Rooftop", fill: "hatch" },
] as const;

export default function AspectRatioCoverGridVariant() {
  return (
    // Every cover keeps the 2:3 of a printed volume, whatever width its grid column gives it.
    <ul className="grid w-full max-w-lg grid-cols-2 gap-4 sm:grid-cols-4">
      {volumes.map((volume) => (
        <li key={volume.number} className="grid gap-2">
          <AspectRatio ratio={2 / 3}>
            <InkFrame
              fill={volume.fill}
              className="flex size-full items-end rounded-md p-2 font-display text-lg text-ink"
            >
              Vol. {volume.number}
            </InkFrame>
          </AspectRatio>
          <span className="text-sm">{volume.title}</span>
        </li>
      ))}
    </ul>
  );
}
