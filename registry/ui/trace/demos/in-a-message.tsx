"use client";

import { FileTextIcon, SearchIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/registry/ui/avatar/avatar";
import { Bubble, BubbleContent } from "@/registry/ui/bubble/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from "@/registry/ui/message/message";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/registry/ui/trace/trace";

export default function TraceInAMessageDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Message align="end">
        <MessageContent>
          <Bubble>
            <BubbleContent>Is Ren left-handed anywhere in volume 2?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Assistant</MessageHeader>
          <Trace>
            <TraceLine>
              <TraceIcon>
                <FileTextIcon />
              </TraceIcon>
              <TraceTitle>Read volume 2</TraceTitle>
              <TraceDescription>9 chapters</TraceDescription>
            </TraceLine>
            <TraceCollapsible defaultOpen>
              <TraceCollapsibleTrigger>
                <TraceLine>
                  <TraceIcon>
                    <SearchIcon />
                  </TraceIcon>
                  <TraceTitle>Searched panel notes for "left hand"</TraceTitle>
                </TraceLine>
              </TraceCollapsibleTrigger>
              <TraceCollapsibleContent>
                Two hits: chapter 9, page 4 (he throws left) and chapter 14, page 11 (he writes
                left).
              </TraceCollapsibleContent>
            </TraceCollapsible>
          </Trace>
          <Bubble variant="ghost">
            <BubbleContent>
              Twice: he throws left in chapter 9 and writes left in chapter 14. Everywhere else he
              is right-handed.
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </div>
  );
}
