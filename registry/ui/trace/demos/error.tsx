import { Bubble, BubbleContent } from "@/registry/ui/bubble/bubble";
import { Message, MessageContent } from "@/registry/ui/message/message";
import { Trace, TraceDescription, TraceLine, TraceTitle } from "@/registry/ui/trace/trace";

export default function TraceErrorDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Message align="end">
        <MessageContent>
          <Bubble>
            <BubbleContent>Export chapter 12 for the printer.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageContent>
          <Trace>
            <TraceLine>
              <TraceTitle>Collected 24 pages</TraceTitle>
              <TraceDescription>0.8 s</TraceDescription>
            </TraceLine>
            {/* The surface's one spot: the failed step. */}
            <TraceLine status="error">
              <TraceTitle>Export stopped: page 5 is missing</TraceTitle>
            </TraceLine>
            <TraceLine status="pending">
              <TraceTitle>Upload to the printer</TraceTitle>
            </TraceLine>
          </Trace>
          <Bubble variant="ghost">
            <BubbleContent>Page 5 is not in the folder. Add it and I will try again.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </div>
  );
}
