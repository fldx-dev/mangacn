"use client";

import { FileTextIcon, ImageIcon, RotateCcwIcon, XIcon } from "lucide-react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/registry/ui/attachment/attachment";
import { Bubble, BubbleContent } from "@/registry/ui/bubble/bubble";
import { Spinner } from "@/registry/ui/spinner/spinner";

export default function AttachmentUploadDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Bubble variant="secondary">
        <BubbleContent>Send me the cover files when you can.</BubbleContent>
      </Bubble>
      {/* Attached to the reply you are writing: not sent yet, sending, and one that failed. */}
      <div className="flex flex-col gap-3 self-end">
        <Attachment state="idle">
          <AttachmentMedia>
            <ImageIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>cover-sketch.png</AttachmentTitle>
            <AttachmentDescription>Ready to send</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove cover-sketch.png">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state="uploading">
          <AttachmentMedia>
            <Spinner />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>cover-inks.psd</AttachmentTitle>
            <AttachmentDescription>Uploading · 64 %</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment state="error">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>cover-colour.tiff</AttachmentTitle>
            <AttachmentDescription>Too large: 52 MB of 50</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Retry cover-colour.tiff">
              <RotateCcwIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </div>
    </div>
  );
}
