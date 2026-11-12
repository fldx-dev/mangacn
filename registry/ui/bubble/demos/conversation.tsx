import { HeartIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/registry/ui/avatar/avatar";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/registry/ui/bubble/bubble";
import { Marker, MarkerContent } from "@/registry/ui/marker/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/registry/ui/message/message";

export default function BubbleConversationDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>HA</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Hana</MessageHeader>
          <BubbleGroup>
            <Bubble variant="secondary">
              <BubbleContent>The editor read the draft.</BubbleContent>
            </Bubble>
            <Bubble variant="secondary" className="mb-4">
              <BubbleContent>She wants the rooftop fight two pages longer.</BubbleContent>
              <BubbleReactions>
                <HeartIcon aria-hidden="true" className="size-3.5" />2
                <span className="sr-only">hearts</span>
              </BubbleReactions>
            </Bubble>
          </BubbleGroup>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <BubbleGroup>
            <Bubble>
              <BubbleContent>Two more pages of rain and speed lines.</BubbleContent>
            </Bubble>
            <Bubble>
              <BubbleContent>Sending the thumbnails tonight.</BubbleContent>
            </Bubble>
          </BubbleGroup>
          <MessageFooter>Read 21:04</MessageFooter>
        </MessageContent>
      </Message>
    </div>
  );
}
