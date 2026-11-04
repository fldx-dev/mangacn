import { Stamp } from "@/registry/ui/stamp/stamp";

export default function StampShapesAndSizesDemo() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-6">
        <Stamp size="sm">OK</Stamp>
        <Stamp size="md">NEW</Stamp>
        <Stamp size="lg">HOT</Stamp>
      </div>
      <div className="flex items-center gap-6">
        <Stamp shape="square" color="ink" size="sm" rotate={4}>
          OK
        </Stamp>
        <Stamp shape="square" color="ink" size="md" rotate={-3}>
          NEW
        </Stamp>
        <Stamp shape="square" color="ink" size="lg" rotate={6}>
          HOT
        </Stamp>
      </div>
    </div>
  );
}
