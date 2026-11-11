import { CharacterCard } from "@/registry/blocks/character-card/character-card";

// A portrait as inline SVG, so the demo needs no files: a bust in ink on a screentone sky.
// Any image URL works.
function portrait(hair: string, sky: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="${sky}"/><circle cx="240" cy="70" r="26" fill="#fafafa" stroke="#222" stroke-width="4"/><path d="M40 400 C40 300 90 270 150 270 C210 270 260 300 260 400 Z" fill="#fafafa" stroke="#222" stroke-width="6"/><circle cx="150" cy="190" r="72" fill="#fafafa" stroke="#222" stroke-width="6"/><path d="${hair}" fill="#222"/><circle cx="125" cy="200" r="7" fill="#222"/><circle cx="175" cy="200" r="7" fill="#222"/><path d="M135 238 Q150 248 165 238" fill="none" stroke="#222" stroke-width="5" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function CharacterCardJapaneseDemo() {
  // lang on the article covers the name, cast role, line and stamp; the reading is ruby over the name.
  return (
    <CharacterCard
      lang="ja"
      name="天野 ミオ"
      reading="あまの みお"
      castRole="主人公・灯籠番"
      portrait={{
        src: portrait(
          "M78 190 C60 90 240 90 222 190 L222 260 C210 200 200 150 150 140 C100 150 90 200 78 260 Z",
          "#bdbdbd",
        ),
        alt: "天野ミオ。長い黒髪、月の下で微笑む",
      }}
      quote="灯りはついた。今夜は誰も迷わない。"
      stats={[
        { label: "勇気", value: 80 },
        { label: "速さ", value: 60 },
      ]}
      status="主役"
    />
  );
}
