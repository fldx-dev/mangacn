import { PowerGauge } from "@/registry/ui/power-gauge/power-gauge";

export default function PowerGaugeSegmentsDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <PowerGauge label="Stamina" value={60} segments={10} />
      <PowerGauge label="Focus" value={3} max={5} segments={5} />
    </div>
  );
}
