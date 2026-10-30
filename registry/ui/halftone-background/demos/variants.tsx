import { HalftoneBackground } from "@/registry/ui/halftone-background/halftone-background";

const tiles = [
  { label: "light, small", props: { tone: "light", size: "sm" } },
  { label: "mid", props: { tone: "mid" } },
  { label: "dark, large", props: { tone: "dark", size: "lg" } },
  { label: "fade bottom", props: { fade: "bottom" } },
  { label: "fade radial", props: { tone: "dark", fade: "radial" } },
  { label: "fade top, large", props: { fade: "top", size: "lg" } },
] as const;

export default function HalftoneBackgroundVariantsDemo() {
  return (
    <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
      {tiles.map(({ label, props }) => (
        <div key={label} className="relative isolate grid aspect-square place-items-end bg-paper">
          <HalftoneBackground {...props} />
          <span className="m-2 bg-paper px-1.5 text-xs">{label}</span>
        </div>
      ))}
    </div>
  );
}
