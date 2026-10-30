import { VerticalText } from "@/registry/ui/vertical-text/vertical-text";

export default function VerticalTextOrientationsDemo() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-10">
      {(["mixed", "upright", "sideways"] as const).map((orientation) => (
        <div key={orientation} className="flex flex-col items-center gap-3">
          <VerticalText lang="ja" orientation={orientation} className="h-44 font-display text-2xl">
            東京 TOKYO 2026
          </VerticalText>
          <span className="text-xs">{orientation}</span>
        </div>
      ))}
    </div>
  );
}
