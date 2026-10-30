import { SpeedLines } from "@/registry/ui/speed-lines/speed-lines";

export default function SpeedLinesDefaultDemo() {
  return (
    <div className="relative isolate grid aspect-video w-full max-w-xl place-items-center bg-paper">
      <SpeedLines />
      <p className="bg-paper px-3 py-1 font-display text-3xl uppercase">Here it comes</p>
    </div>
  );
}
