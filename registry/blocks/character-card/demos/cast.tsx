import { CharacterCard } from "@/registry/blocks/character-card/character-card";

// A portrait as inline SVG, so the demo needs no files: a bust in ink on a screentone sky.
// Any image URL works.
function portrait(hair: string, sky: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="${sky}"/><circle cx="240" cy="70" r="26" fill="#fafafa" stroke="#222" stroke-width="4"/><path d="M40 400 C40 300 90 270 150 270 C210 270 260 300 260 400 Z" fill="#fafafa" stroke="#222" stroke-width="6"/><circle cx="150" cy="190" r="72" fill="#fafafa" stroke="#222" stroke-width="6"/><path d="${hair}" fill="#222"/><circle cx="125" cy="200" r="7" fill="#222"/><circle cx="175" cy="200" r="7" fill="#222"/><path d="M135 238 Q150 248 165 238" fill="none" stroke="#222" stroke-width="5" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const cast = [
  {
    name: "Mio Amano",
    castRole: "Lead",
    hair: "M78 190 C70 100 230 100 222 190 C200 150 110 140 78 190 Z",
    alt: "Mio Amano, short dark hair",
  },
  {
    name: "Ren Kuroda",
    castRole: "Rival",
    hair: "M74 200 L90 110 L120 140 L150 96 L180 140 L210 110 L226 200 C200 160 100 160 74 200 Z",
    alt: "Ren Kuroda, spiky black hair",
  },
  {
    name: "Old Tomo",
    hair: "M90 160 C110 130 190 130 210 160 C190 150 110 150 90 160 Z",
    alt: "Old Tomo, nearly bald, a thin fringe of hair",
  },
];

export default function CharacterCardCastDemo() {
  // A cast page: narrow cards side by side, only a name, a cast role and a portrait each.
  return (
    <ul className="grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-3">
      {cast.map(({ name, castRole, hair, alt }) => (
        <li key={name} className="flex">
          <CharacterCard
            name={name}
            castRole={castRole}
            portrait={{ src: portrait(hair, "#ededed"), alt }}
            href={`#${name.toLowerCase().replace(" ", "-")}`}
          />
        </li>
      ))}
    </ul>
  );
}
