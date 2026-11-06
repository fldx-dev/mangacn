import { MangaFrame } from "@/registry/ui/manga-frame/manga-frame";

// Any image URL works; this grayscale skyline is an inline SVG, so the demo needs no files.
const skyline = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
<rect width="400" height="300" fill="#ededed"/>
<circle cx="290" cy="90" r="44" fill="#fafafa" stroke="#222" stroke-width="3"/>
<path d="M0 210 L40 210 L40 150 L80 150 L80 185 L115 185 L115 120 L150 120 L150 200 L190 200 L190 160 L230 160 L230 205 L260 205 L260 140 L300 140 L300 190 L340 190 L340 130 L370 130 L370 200 L400 200 L400 300 L0 300 Z" fill="#555"/>
<path d="M0 250 L400 240 L400 300 L0 300 Z" fill="#222"/>
<g stroke="#222" stroke-width="2"><line x1="20" y1="40" x2="70" y2="90"/><line x1="60" y1="30" x2="110" y2="80"/><line x1="100" y1="20" x2="150" y2="70"/></g>
</svg>`;
const scene = `data:image/svg+xml,${encodeURIComponent(skyline)}`;

export default function MangaFrameVariantsDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-2 items-start gap-6 sm:grid-cols-4">
      <MangaFrame src={scene} alt="Skyline, 4 by 3" aspect="4/3" caption="4/3" />
      <MangaFrame src={scene} alt="Skyline, 3 by 4" aspect="3/4" caption="3/4" />
      <MangaFrame src={scene} alt="Skyline, square" aspect="1/1" caption="1/1" />
      <MangaFrame src={scene} alt="Skyline, 16 by 9" aspect="16/9" caption="16/9" />
      <MangaFrame
        src={scene}
        alt="Skyline on a halftone mat"
        matte
        caption="With a halftone mat"
        className="col-span-2"
      />
    </div>
  );
}
