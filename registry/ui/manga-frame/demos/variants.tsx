import { MangaFrame } from "@/registry/ui/manga-frame/manga-frame";
import { scene } from "./scene";

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
