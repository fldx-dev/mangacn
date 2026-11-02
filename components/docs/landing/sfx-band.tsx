import { SfxText } from "@/registry/ui/sfx-text/sfx-text";

/** Sound effects in both scripts; the band repeats them so the loop never shows a seam. */
const WORDS: { text: string; lang?: "ja"; spot?: boolean }[] = [
  { text: "ドン！", lang: "ja" },
  { text: "DOKAN!" },
  { text: "バン！", lang: "ja", spot: true },
  { text: "ZUDON!" },
  { text: "ゴゴゴ", lang: "ja" },
  { text: "SHUUU", spot: true },
  { text: "ドドド", lang: "ja" },
  { text: "BAM!" },
];

function Track() {
  return (
    <div className="flex shrink-0 items-center">
      {WORDS.map((word, index) => (
        <SfxText
          key={word.text}
          lang={word.lang}
          size="md"
          color={word.spot ? "spot" : "ink"}
          rotate={index % 2 ? 5 : -5}
          className="mx-6 sm:mx-10"
        >
          {word.text}
        </SfxText>
      ))}
    </div>
  );
}

/**
 * Section 3: a marquee of sound effects, the strip between the splash and the pitch. Decorative,
 * so it is hidden from assistive tech; it stands still under reduced motion and on hover.
 */
export function SfxBand() {
  return (
    <div
      data-landing="sfx-band"
      aria-hidden="true"
      className="relative overflow-hidden border-b bg-paper py-5"
    >
      <div className="flex w-max motion-safe:animate-[mangacn-marquee_40s_linear_infinite] hover:[animation-play-state:paused]">
        <Track />
        <Track />
      </div>
    </div>
  );
}
