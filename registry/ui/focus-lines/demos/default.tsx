import { FocusLines } from "@/registry/ui/focus-lines/focus-lines";

export default function FocusLinesDefaultDemo() {
  return (
    <div className="relative isolate grid aspect-video w-full max-w-xl place-items-center overflow-hidden bg-paper">
      <FocusLines />
      <p className="font-display text-4xl uppercase">Huh?!</p>
    </div>
  );
}
