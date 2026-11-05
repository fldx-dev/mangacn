import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card/card";
import { PowerGauge } from "@/registry/ui/power-gauge/power-gauge";

export default function PowerGaugeStatCardDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Aki Moriyama</CardTitle>
        <CardDescription>Inker, Studio Kumo. Level 12.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <PowerGauge label="Power" value={64} segments={10} burst />
        <PowerGauge label="Speed" value={82} segments={10} burst />
        <PowerGauge label="Ink" value={100} segments={10} burst />
      </CardContent>
    </Card>
  );
}
