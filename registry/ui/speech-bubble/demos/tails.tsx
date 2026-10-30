import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";

const tails = [
  "top-left",
  "top-right",
  "left",
  "right",
  "bottom-left",
  "bottom-right",
  "none",
] as const;

export default function SpeechBubbleTailsDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-6">
      {(["round", "square", "shout"] as const).map((shape) => (
        <div key={shape} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          {tails.map((tail) => (
            <SpeechBubble key={tail} shape={shape} tail={tail} className="text-sm">
              {tail}
            </SpeechBubble>
          ))}
        </div>
      ))}
    </div>
  );
}
