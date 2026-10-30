import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";

export default function SpeechBubbleShapesDemo() {
  return (
    <div className="flex w-full max-w-2xl flex-wrap items-start justify-center gap-8">
      <SpeechBubble>Round, for everyday talk.</SpeechBubble>
      <SpeechBubble shape="square" tail="bottom-right">
        Square, for a flat voice.
      </SpeechBubble>
      <SpeechBubble shape="shout">Behind you!!</SpeechBubble>
      <SpeechBubble shape="whisper" tail="bottom-right">
        psst… over here
      </SpeechBubble>
      <SpeechBubble tone="light" tail="none">
        A light tone, no tail.
      </SpeechBubble>
      <SpeechBubble font="inherit" shape="square" tail="none">
        Inherits the page font.
      </SpeechBubble>
    </div>
  );
}
