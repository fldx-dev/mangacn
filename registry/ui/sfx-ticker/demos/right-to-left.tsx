import { SfxTicker } from "@/registry/ui/sfx-ticker/sfx-ticker";

export default function SfxTickerRightToLeftDemo() {
  return (
    <SfxTicker
      direction="right"
      className="w-full"
      words={[
        "VROOM!",
        { text: "ブォォン", lang: "ja" },
        { text: "SCREECH!", color: "spot" },
        { text: "キキーッ", lang: "ja" },
        "ZOOM!",
      ]}
    />
  );
}
