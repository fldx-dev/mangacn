import { MangaFrame } from "@/registry/ui/manga-frame/manga-frame";
import { scene } from "./scene";

export default function MangaFrameDefaultDemo() {
  return (
    <MangaFrame
      src={scene}
      alt="A city skyline under a pale moon"
      caption="Chapter 1: the city at night."
      className="w-full max-w-md"
    />
  );
}
