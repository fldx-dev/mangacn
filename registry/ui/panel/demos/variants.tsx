import { Panel } from "@/registry/ui/panel/panel";

export default function PanelVariantsDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
      <Panel tone="halftone" caption="Halftone" className="min-h-32">
        <p className="w-fit bg-paper px-1 text-sm">Dots for dusk and shadows.</p>
      </Panel>
      <Panel tone="lines" caption="Lines" captionSide="top-right" className="min-h-32">
        <p className="w-fit bg-paper px-1 text-sm">Diagonal tone for tension.</p>
      </Panel>
      <Panel tone="cross" caption="Cross" captionSide="bottom-left" className="min-h-32">
        <p className="w-fit bg-paper px-1 text-sm">Cross-hatch for night.</p>
      </Panel>
      <Panel shadow caption="Shadow" captionSide="bottom-right" className="min-h-32">
        <p className="w-fit bg-paper px-1 text-sm">A hatched shadow, on request.</p>
      </Panel>
    </div>
  );
}
