import { PowerGauge } from "@/registry/ui/power-gauge/power-gauge";

export default function PowerGaugeDefaultDemo() {
  return (
    <div className="w-full max-w-xs">
      <PowerGauge label="Power" value={70} />
    </div>
  );
}
