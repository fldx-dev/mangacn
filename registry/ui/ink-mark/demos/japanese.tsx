import { InkMark } from "@/registry/ui/ink-mark/ink-mark";
import { VerticalText } from "@/registry/ui/vertical-text/vertical-text";

export default function InkMarkJapaneseDemo() {
  return (
    <div lang="ja" className="flex items-start gap-10">
      <p className="max-w-56 text-xl leading-loose">
        この物語は<InkMark kind="circle">週刊連載</InkMark>
        として始まり、<InkMark kind="highlight">十年</InkMark>続いた。
      </p>
      {/* Vertical text takes the sideline on the right, where Japanese sets it. */}
      <VerticalText className="h-44 text-xl leading-loose">
        最終話は<InkMark color="spot">来週</InkMark>の発売です。
      </VerticalText>
    </div>
  );
}
