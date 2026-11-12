import { Trace, TraceDescription, TraceLine, TraceTitle } from "@/registry/ui/trace/trace";

export default function TraceDefaultDemo() {
  return (
    <Trace className="max-w-sm">
      <TraceLine>
        <TraceTitle>Read chapter-12-script.md</TraceTitle>
        <TraceDescription>0.4 s</TraceDescription>
      </TraceLine>
      <TraceLine>
        <TraceTitle>Searched the style guide</TraceTitle>
        <TraceDescription>1.2 s</TraceDescription>
      </TraceLine>
      <TraceLine status="running">
        <TraceTitle>Drafting panel notes</TraceTitle>
      </TraceLine>
      <TraceLine status="pending">
        <TraceTitle>Check the lettering</TraceTitle>
      </TraceLine>
    </Trace>
  );
}
