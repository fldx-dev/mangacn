import { Emanata } from "@/registry/ui/emanata/emanata";
import { SfxText } from "@/registry/ui/sfx-text/sfx-text";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";

/** Hero cell "On the page": a line of dialogue with its sound effect and an anger mark. */
export function HeroPage() {
  return (
    <div className="relative flex w-full flex-col items-center gap-2 pt-1">
      <div className="relative">
        <SpeechBubble lang="ja" aria-label="Kenji" className="max-w-[13rem] text-sm">
          遅いぞ。もう始まってる！
        </SpeechBubble>
        <Emanata kind="anger" size="sm" color="spot" className="absolute -top-2 -right-1" />
      </div>
      <SfxText lang="ja" size="md" rotate={-8} className="self-end">
        ドン！
      </SfxText>
    </div>
  );
}
