import { FocusLines } from "@/registry/ui/focus-lines/focus-lines";
import { Panel } from "@/registry/ui/panel/panel";

export default function FocusLinesInAPanelDemo() {
  return (
    // A panel does not clip; the lines clip to their own layer, inset to the inside of the stroke.
    <Panel className="min-h-64 w-full max-w-md items-center justify-center">
      <FocusLines color="tone" count={72} className="inset-(--outline-width-heavy)" />
      <p className="bg-paper px-2 font-display text-4xl uppercase">Huh?!</p>
    </Panel>
  );
}
