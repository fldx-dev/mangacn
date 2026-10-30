import { SpeedLines } from "@/registry/ui/speed-lines/speed-lines";

const tiles = [
  { label: "left", props: { direction: "left" } },
  { label: "right, dense", props: { direction: "right", density: "dense" } },
  { label: "sparse, tone", props: { density: "sparse", color: "tone" } },
  { label: "off-centre", props: { center: [25, 70] } },
] as const;

export default function SpeedLinesVariantsDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
      {tiles.map(({ label, props }) => (
        <div
          key={label}
          className="relative isolate grid aspect-video place-items-center overflow-hidden bg-paper"
        >
          <SpeedLines {...props} />
          <span className="bg-paper px-2 text-sm">{label}</span>
        </div>
      ))}
    </div>
  );
}
