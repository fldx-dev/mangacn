import { Kbd, KbdGroup } from "@/registry/ui/kbd/kbd";

export default function KbdGroupDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <span>+</span>
        <Kbd>K</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>Shift</Kbd>
        <span>+</span>
        <Kbd>Space</Kbd>
      </KbdGroup>
    </div>
  );
}
