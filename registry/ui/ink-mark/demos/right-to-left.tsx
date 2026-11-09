import { InkMark } from "@/registry/ui/ink-mark/ink-mark";

export default function InkMarkRightToLeftDemo() {
  return (
    // Under dir="rtl" the marks follow the text: the underline draws on from the right and the
    // bracket opens on the right of the phrase.
    <p lang="ar" dir="rtl" className="max-w-xs text-xl leading-loose">
      بدأت هذه القصة <InkMark>كسلسلة أسبوعية</InkMark> واستمرت{" "}
      <InkMark kind="bracket">عشر سنوات</InkMark>.
    </p>
  );
}
