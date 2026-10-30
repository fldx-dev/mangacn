import { InkFrame } from "@/registry/theme/ink-frame/ink-frame";

export default function InkFrameDefaultDemo() {
  return (
    <div className="grid w-full max-w-xl gap-8 text-ink">
      <div className="flex flex-wrap items-center gap-4">
        <InkFrame className="px-3 py-1.5 text-sm">Paper</InkFrame>
        <InkFrame fill="ink" className="px-3 py-1.5 text-sm text-paper">
          Ink
        </InkFrame>
        <InkFrame fill="tone" className="px-3 py-1.5 text-sm">
          Tone
        </InkFrame>
        <InkFrame fill="none" className="px-3 py-1.5 text-sm">
          None
        </InkFrame>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <InkFrame className="px-4 py-3 text-sm">Rect</InkFrame>
        <InkFrame shape="ellipse" className="px-6 py-3 text-sm">
          Ellipse
        </InkFrame>
        <InkFrame shape="line" className="h-(--outline-width) w-24" />
        <InkFrame shape="line" className="h-10 w-(--outline-width)" />
      </div>
      <InkFrame shadow="hatch" className="max-w-xs p-4 text-sm">
        A hatched shadow, only when a component asks for one.
      </InkFrame>
    </div>
  );
}
