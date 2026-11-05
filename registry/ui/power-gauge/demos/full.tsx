import { PowerGauge } from "@/registry/ui/power-gauge/power-gauge";

export default function PowerGaugeFullDemo() {
  return (
    <div className="w-full max-w-xs">
      <PowerGauge
        label="Fighting spirit"
        value={9000}
        max={9000}
        color="spot"
        burst
        format={(value) => `${value.toLocaleString("en-US")} pts`}
      />
    </div>
  );
}
