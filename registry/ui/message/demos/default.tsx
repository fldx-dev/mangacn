import { Avatar, AvatarFallback } from "@/registry/ui/avatar/avatar";
import { Bubble, BubbleContent } from "@/registry/ui/bubble/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/registry/ui/message/message";

export default function MessageDefaultDemo() {
  return (
    <Message className="max-w-sm">
      <MessageAvatar>
        <Avatar>
          <AvatarFallback>RE</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>Ren</MessageHeader>
        <Bubble variant="secondary">
          <BubbleContent>Page 22 is lettered. The shout fits now.</BubbleContent>
        </Bubble>
        <MessageFooter>21:12</MessageFooter>
      </MessageContent>
    </Message>
  );
}
