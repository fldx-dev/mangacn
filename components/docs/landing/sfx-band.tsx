import { SfxTicker, type SfxTickerWord } from "@/registry/ui/sfx-ticker/sfx-ticker";

/** Sound effects in both scripts; the ticker repeats them so the loop never shows a seam. */
const WORDS: SfxTickerWord[] = [
  { text: "東京！", lang: "ja" },
  { text: "KYOTO!" },
  { text: "バン！", lang: "ja", color: "spot" },
  { text: "ZUDON!" },
  { text: "ゴゴゴ", lang: "ja" },
  { text: "SHUUU", color: "spot" },
  { text: "ドドド", lang: "ja" },
  { text: "BAM!" },
];

/**
 * Section 3: a marquee of sound effects, the strip between the splash and the pitch: the
 * `sfx-ticker` item. Decorative, so it is hidden from assistive tech; it stands still under
 * reduced motion and on hover.
 */
export function SfxBand() {
  return <SfxTicker data-landing="sfx-band" words={WORDS} className="border-b bg-paper" />;
}
