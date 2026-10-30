import { Panel } from "@/registry/ui/panel/panel";
import { PanelGrid, PanelGridItem } from "@/registry/ui/panel-grid/panel-grid";

export default function PanelGridSpansDemo() {
  return (
    <PanelGrid columns={{ sm: 2, lg: 3 }} gutter="sm" className="max-w-3xl">
      <PanelGridItem colSpan="full">
        <Panel tone="cross" caption="Establishing shot" className="min-h-24">
          <p className="w-fit bg-paper px-1 text-sm">The whole school, from the roof.</p>
        </Panel>
      </PanelGridItem>
      <PanelGridItem rowSpan={2}>
        <Panel tone="halftone" className="min-h-40">
          <p className="w-fit bg-paper px-1 text-sm">A tall panel spans two rows.</p>
        </Panel>
      </PanelGridItem>
      <PanelGridItem colSpan={2}>
        <Panel className="min-h-20">
          <p className="w-fit bg-paper px-1 text-sm">A wide one spans two columns.</p>
        </Panel>
      </PanelGridItem>
      <PanelGridItem>
        <Panel className="min-h-20">
          <p className="w-fit bg-paper px-1 text-sm">Small.</p>
        </Panel>
      </PanelGridItem>
      <PanelGridItem>
        <Panel tone="lines" className="min-h-20">
          <p className="w-fit bg-paper px-1 text-sm">Smaller.</p>
        </Panel>
      </PanelGridItem>
    </PanelGrid>
  );
}
