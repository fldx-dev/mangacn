import { Avatar, AvatarFallback } from "@/registry/ui/avatar/avatar";
import { Bubble, BubbleContent, BubbleGroup } from "@/registry/ui/bubble/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/registry/ui/message/message";

export default function MessageThreadDemo() {
  return (
    <MessageGroup className="w-full max-w-md gap-4">
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
              <BubbleContent>Cover sketch is up.</BubbleContent>
            </Bubble>
            <Bubble variant="secondary">
              <BubbleContent>Ren on the water tower, the city behind him.</BubbleContent>
            </Bubble>
          </BubbleGroup>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>YU</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>You</MessageHeader>
          <Bubble>
            <BubbleContent>Love it. Make the moon bigger?</BubbleContent>
          </Bubble>
          <MessageFooter>Read 09:40</MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>
  );
}
