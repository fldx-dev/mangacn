import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";

export default function SpeechBubbleJapaneseDemo() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      <SpeechBubble aria-label="Kenji" lang="ja">
        遅いぞ。もう始まってる！
      </SpeechBubble>
      <SpeechBubble aria-label="Aiko" lang="ja" tail="bottom-right">
        HEROは遅れて来るものよ。
      </SpeechBubble>
    </div>
  );
}
