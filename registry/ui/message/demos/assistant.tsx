import { Avatar, AvatarFallback } from "@/registry/ui/avatar/avatar";
import { Bubble, BubbleContent } from "@/registry/ui/bubble/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/registry/ui/message/message";

export default function MessageAssistantDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Message align="end">
        <MessageContent>
          <Bubble>
            <BubbleContent>Suggest a name for the rival school.</BubbleContent>
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
          <Bubble variant="ghost">
            <BubbleContent>
              Kurogane Academy: "black steel", for a school that trains in the shipyard. Its crest
              could be an anchor through a gear.
            </BubbleContent>
          </Bubble>
          <MessageFooter>Edited</MessageFooter>
        </MessageContent>
      </Message>
    </div>
  );
}
