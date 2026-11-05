import { PageNumber } from "@/registry/ui/page-number/page-number";

export default function PageNumberWithChapterDemo() {
  return (
    // A two-page spread's folios: each hugs its page's outer edge.
    <div className="flex w-full max-w-sm justify-between gap-6">
      <PageNumber page={6} side="left" chapter="Ch. 12" />
      <PageNumber page={7} chapter="Rooftop" />
    </div>
  );
}
