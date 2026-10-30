import { FocusLines } from "@/registry/ui/focus-lines/focus-lines";

const tiles = [
  { label: "long", props: { length: "long" } },
  { label: "24 lines", props: { count: 24 } },
  { label: "tone, 120 lines", props: { color: "tone", count: 120 } },
  { label: "off-centre", props: { center: [70, 35] } },
] as const;

export default function FocusLinesVariantsDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
      {tiles.map(({ label, props }) => (
        <div
          key={label}
          className="relative isolate grid aspect-video place-items-center overflow-hidden bg-paper"
        >
          <FocusLines {...props} />
          <span className="bg-paper px-2 text-sm">{label}</span>
        </div>
      ))}
    </div>
  );
}
