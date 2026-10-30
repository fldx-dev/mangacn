import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";
import { VerticalText } from "@/registry/ui/vertical-text/vertical-text";

export default function VerticalTextDefaultDemo() {
  return (
    <div className="flex items-start gap-10">
      <SpeechBubble tail="left" className="px-5 py-7">
        <VerticalText lang="ja" className="h-40 font-display text-xl leading-relaxed">
          まさか、 君がHEROなの？
        </VerticalText>
      </SpeechBubble>
      <VerticalText lang="ja" className="h-48 font-display text-3xl">
        第1話 東京NIGHT
      </VerticalText>
    </div>
  );
}
