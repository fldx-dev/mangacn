import { MangaFrame } from "@/registry/ui/manga-frame/manga-frame";
import { SpeedLines } from "@/registry/ui/speed-lines/speed-lines";

export default function MangaFrameLetteredDemo() {
  return (
    // Children in place of `src`: a title card lettered in the theme's faces, on its tokens, so it
    // follows dark mode and stays real text. The scene box is `relative isolate` for the lines.
    <MangaFrame aspect="16/9" caption="Chapter 2: the title page." className="w-full max-w-md">
      <SpeedLines color="tone" density="dense" />
      <div className="grid gap-1 bg-paper px-4 py-2 text-center">
        <p className="font-display text-3xl uppercase sm:text-5xl">Rooftop</p>
        <p lang="ja" className="font-dialogue text-base sm:text-lg">
          屋上の決闘
        </p>
      </div>
    </MangaFrame>
  );
}
