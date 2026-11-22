import { InkFrame } from "@/components/ink-frame";
import { VerticalText } from "@/registry/ui/vertical-text/vertical-text";

const volumes = [
  { number: "1", tone: "" },
  { number: "2", tone: "halftone-light" },
  { number: "3", tone: "" },
  { number: "4", tone: "halftone-light" },
];

export default function VerticalTextVolumeSpinesVariant() {
  return (
    // A shelf of tankobon spines: the series title runs down each one, the volume number upright
    // at the foot, as on a Japanese bookshelf.
    <ul aria-label="Night Bus, volumes 1 to 4" className="flex items-end gap-1.5">
      {volumes.map(({ number, tone }) => (
        <li
          key={number}
          lang="ja"
          className="relative isolate flex h-60 w-12 flex-col items-center justify-between py-3"
        >
          <InkFrame
            as="span"
            fill="paper"
            className="pointer-events-none absolute inset-0 -z-1 rounded-none"
          />
          {tone && <span aria-hidden="true" className={`absolute inset-1 -z-1 ${tone}`} />}
          <VerticalText className="h-36 bg-paper font-display text-xl tracking-widest">
            夜行バス
          </VerticalText>
          <VerticalText orientation="upright" className="bg-paper font-display text-lg">
            {`${number}巻`}
          </VerticalText>
        </li>
      ))}
    </ul>
  );
}
