import { SfxTicker } from "@/registry/ui/sfx-ticker/sfx-ticker";

export default function SfxTickerDefaultDemo() {
  return (
    <SfxTicker
      className="w-full"
      words={[
        { text: "ドン！", lang: "ja" },
        "DOKAN!",
        { text: "バン！", lang: "ja" },
        "ZUDON!",
        { text: "ゴゴゴ", lang: "ja" },
        "SHUUU",
        { text: "ドドド", lang: "ja" },
        "BAM!",
      ]}
    />
  );
}
