import { InkSplatter } from "@/registry/ui/ink-splatter/ink-splatter";

export default function InkSplatterKindsDemo() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <InkSplatter kind="splat" seed={3} />
        <InkSplatter kind="drip" seed={5} />
        <InkSplatter kind="dots" seed={8} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-6">
        <InkSplatter size="sm" color="spot" seed={21} />
        <InkSplatter size="sm" color="spot" seed={22} />
        <InkSplatter size="sm" color="spot" seed={23} />
      </div>
    </div>
  );
}
