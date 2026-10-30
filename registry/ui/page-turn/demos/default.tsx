import { PageTurn } from "@/registry/ui/page-turn/page-turn";
import { Panel } from "@/registry/ui/panel/panel";

export default function PageTurnDefaultDemo() {
  return (
    <PageTurn pageKey={1} className="w-full max-w-sm">
      <Panel caption="Page 1" className="min-h-48">
        <p className="mt-auto font-display text-2xl uppercase">The story begins</p>
      </Panel>
    </PageTurn>
  );
}
