import { InkMark } from "@/registry/ui/ink-mark/ink-mark";

export default function InkMarkDefaultVariant() {
  return (
    <p className="max-w-md text-lg">
      Every chapter of this series ends on a <InkMark>cliffhanger</InkMark>, so keep the next issue
      close.
    </p>
  );
}
