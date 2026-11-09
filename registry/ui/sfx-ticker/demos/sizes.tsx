import { SfxTicker } from "@/registry/ui/sfx-ticker/sfx-ticker";

export default function SfxTickerSizesDemo() {
  return (
    <div className="flex w-full flex-col gap-2">
      <SfxTicker
        size="sm"
        speed="slow"
        className="w-full"
        words={["TAP", { text: "トン", lang: "ja" }, "TAP", { text: "コツ", lang: "ja" }]}
      />
      <SfxTicker
        size="lg"
        speed="fast"
        className="w-full"
        words={[{ text: "ドドド", lang: "ja" }, { text: "KABOOM!", color: "spot" }, "WHAM!"]}
      />
    </div>
  );
}
