import { Kbd } from "@/registry/ui/kbd/kbd";

export default function KbdDefaultDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Kbd>Esc</Kbd>
      <Kbd>Shift</Kbd>
      <Kbd>Space</Kbd>
      <Kbd>J</Kbd>
      <Kbd>K</Kbd>
    </div>
  );
}
