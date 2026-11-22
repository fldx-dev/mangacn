import { Panel } from "@/registry/ui/panel/panel";
import { PanelGrid, PanelGridItem } from "@/registry/ui/panel-grid/panel-grid";

const beats = [
  { tone: "none", text: "Deadline: tomorrow, 9 a.m." },
  { tone: "lines", text: "Twelve pages left to ink." },
  { tone: "halftone", text: "Coffee number five." },
  { tone: "none", text: "The editor: “Deadline moved to next week.”" },
] as const;

export default function PanelGridFourKomaVariant() {
  return (
    // A 4-koma strip: one column at every width, four equal beats read top to bottom.
    <div className="grid w-full max-w-xs gap-3">
      <h2 className="text-center font-display text-xl uppercase">Crunch Time</h2>
      <PanelGrid columns={1} gutter="sm">
        {beats.map((beat) => (
          <PanelGridItem key={beat.text}>
            <Panel tone={beat.tone} className="aspect-2/1">
              <p className="mt-auto w-fit bg-paper px-1 text-sm">{beat.text}</p>
            </Panel>
          </PanelGridItem>
        ))}
      </PanelGrid>
    </div>
  );
}
