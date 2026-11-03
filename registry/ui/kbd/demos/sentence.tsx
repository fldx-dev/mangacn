import { Kbd } from "@/registry/ui/kbd/kbd";

export default function KbdSentenceDemo() {
  return (
    <p className="max-w-sm text-sm leading-7">
      Press <Kbd>Space</Kbd> or <Kbd>J</Kbd> for the next page and <Kbd>K</Kbd> to go back. Hold{" "}
      <Kbd>Shift</Kbd> to jump a whole chapter.
    </p>
  );
}
