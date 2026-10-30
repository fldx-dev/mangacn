import { Progress, ProgressLabel, ProgressValue } from "@/registry/ui/progress/progress";

export default function ProgressDefaultDemo() {
  return (
    <Progress value={64} className="w-full max-w-xs">
      <ProgressLabel>Inking chapter 12</ProgressLabel>
      <ProgressValue />
    </Progress>
  );
}
