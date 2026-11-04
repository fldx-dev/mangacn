import { SfxTicker } from "@/registry/ui/sfx-ticker/sfx-ticker";

export default function SfxTickerSpotAndSpeedDemo() {
  return (
    <div className="flex w-full flex-col gap-2">
      <SfxTicker
        label="Fight sounds"
        speed="fast"
        words={["POW!", { text: "BAM!", color: "spot" }, "WHAM!", { text: "KRAK!", color: "spot" }]}
      />
      <SfxTicker
        speed="slow"
        color="paper"
        words={[{ text: "シーン", lang: "ja" }, "HUSH", { text: "ザァァ", lang: "ja" }, "DRIP"]}
      />
    </div>
  );
}
