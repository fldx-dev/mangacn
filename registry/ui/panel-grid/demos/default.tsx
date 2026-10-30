import { Panel } from "@/registry/ui/panel/panel";
import { PanelGrid, PanelGridItem } from "@/registry/ui/panel-grid/panel-grid";

export default function PanelGridDefaultDemo() {
  return (
    <PanelGrid columns={2} className="max-w-2xl">
      <PanelGridItem>
        <Panel caption="Page 1" className="min-h-28">
          <p className="w-fit bg-paper px-1 text-sm">The bell rings.</p>
        </Panel>
      </PanelGridItem>
      <PanelGridItem>
        <Panel tone="halftone" className="min-h-28">
          <p className="w-fit bg-paper px-1 text-sm">Nobody moves.</p>
        </Panel>
      </PanelGridItem>
      <PanelGridItem>
        <Panel tone="lines" className="min-h-28">
          <p className="w-fit bg-paper px-1 text-sm">A chair scrapes.</p>
        </Panel>
      </PanelGridItem>
      <PanelGridItem>
        <Panel className="min-h-28">
          <p className="font-display text-xl uppercase">Run!</p>
        </Panel>
      </PanelGridItem>
    </PanelGrid>
  );
}
