import { FileTextIcon } from "lucide-react";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/registry/ui/attachment/attachment";
import { Bubble, BubbleContent, BubbleGroup } from "@/registry/ui/bubble/bubble";
import { Message, MessageContent, MessageFooter } from "@/registry/ui/message/message";

// Any image URL works; this thumbnail (a panel with a figure on screentone) is an inline SVG, so
// the demo loads no network image.
const panel = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><pattern id="t" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.9" fill="#9a9a9a"/></pattern></defs>
<rect width="64" height="64" fill="#f4f1ea"/>
<rect width="64" height="40" fill="url(#t)"/>
<path d="M0 40h64" stroke="#222" stroke-width="2"/>
<path d="M22 64l4-22h12l4 22z" fill="#222"/>
<circle cx="32" cy="34" r="7" fill="#f4f1ea" stroke="#222" stroke-width="2"/>
</svg>`;
const thumbnail = `data:image/svg+xml,${encodeURIComponent(panel)}`;

export default function AttachmentInABubbleDemo() {
  return (
    <Message align="end" className="max-w-md">
      <MessageContent>
        {/* Full width, so each bubble's 80 % is of the message, not of the widest bubble. */}
        <BubbleGroup className="w-full">
          <Bubble>
            <BubbleContent>Pages 1 to 4, and the script with my notes.</BubbleContent>
          </Bubble>
          <Bubble>
            <BubbleContent className="p-1">
              {/* Wraps rather than scrolls, so a narrow bubble shows every file whole. */}
              <AttachmentGroup className="flex-wrap">
                <Attachment size="sm">
                  <AttachmentMedia variant="image">
                    {/* biome-ignore lint/performance/noImgElement: framework-free, as stock's demo. */}
                    <img src={thumbnail} alt="" />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>page-01.png</AttachmentTitle>
                    <AttachmentDescription>PNG · 1.1 MB</AttachmentDescription>
                  </AttachmentContent>
                </Attachment>
                <Attachment size="sm">
                  <AttachmentMedia>
                    <FileTextIcon />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>script-notes.pdf</AttachmentTitle>
                    <AttachmentDescription>PDF · 380 KB</AttachmentDescription>
                  </AttachmentContent>
                </Attachment>
              </AttachmentGroup>
            </BubbleContent>
          </Bubble>
        </BubbleGroup>
        <MessageFooter>Sent 18:20</MessageFooter>
      </MessageContent>
    </Message>
  );
}
