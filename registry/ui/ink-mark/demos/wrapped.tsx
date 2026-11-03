import { InkMark } from "@/registry/ui/ink-mark/ink-mark";

export default function InkMarkWrappedDemo() {
  return (
    <p className="max-w-xs text-lg">
      The editor asked for{" "}
      <InkMark color="spot">a final page that nobody in the room saw coming</InkMark>, and then went
      home early.
    </p>
  );
}
