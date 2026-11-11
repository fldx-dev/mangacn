import { CharacterCard } from "@/registry/blocks/character-card/character-card";

// A portrait as inline SVG, so the demo needs no files: a bust in ink on a screentone sky.
// Any image URL works.
function portrait(hair: string, sky: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="${sky}"/><circle cx="240" cy="70" r="26" fill="#fafafa" stroke="#222" stroke-width="4"/><path d="M40 400 C40 300 90 270 150 270 C210 270 260 300 260 400 Z" fill="#fafafa" stroke="#222" stroke-width="6"/><circle cx="150" cy="190" r="72" fill="#fafafa" stroke="#222" stroke-width="6"/><path d="${hair}" fill="#222"/><circle cx="125" cy="200" r="7" fill="#222"/><circle cx="175" cy="200" r="7" fill="#222"/><path d="M135 238 Q150 248 165 238" fill="none" stroke="#222" stroke-width="5" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function CharacterCardDefaultDemo() {
  // The whole card links to the character's page; the stats read as text, the gauges draw them.
  return (
    <CharacterCard
      name="Mio Amano"
      castRole="Lead · Lantern keeper"
      portrait={{
        src: portrait("M78 190 C70 100 230 100 222 190 C200 150 110 140 78 190 Z", "#d6d6d6"),
        alt: "Mio Amano, short dark hair, smiling under a pale moon",
      }}
      quote="The lanterns are lit. Nobody gets lost tonight."
      stats={[
        { label: "Courage", value: 80 },
        { label: "Speed", value: 60 },
        { label: "Luck", value: 3, max: 10 },
      ]}
      status="MAIN"
      href="#mio-amano"
    />
  );
}
