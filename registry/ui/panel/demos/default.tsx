import { Panel } from "@/registry/ui/panel/panel";

export default function PanelDefaultDemo() {
  return (
    <Panel caption="Tokyo, 3 a.m." className="w-full max-w-md">
      <h2 className="font-display text-2xl uppercase">The city never sleeps</h2>
      <p className="text-sm">
        Rain on the rooftops, neon in the puddles, and somewhere below a door slams shut.
      </p>
    </Panel>
  );
}
