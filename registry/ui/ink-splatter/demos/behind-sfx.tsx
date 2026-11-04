import { InkSplatter } from "@/registry/ui/ink-splatter/ink-splatter";
import { SfxText } from "@/registry/ui/sfx-text/sfx-text";

export default function InkSplatterBehindSfxDemo() {
  return (
    // The demo places the splatter: centred behind the word, inside a relative, isolated box.
    <div className="relative isolate inline-grid place-items-center px-6 py-8">
      <InkSplatter
        size="lg"
        color="spot"
        seed={17}
        className="absolute top-1/2 left-1/2 -z-1 -translate-x-1/2 -translate-y-1/2"
      />
      <SfxText size="lg">Splash!</SfxText>
    </div>
  );
}
