"use client";

import { Button } from "@/registry/ui/button/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/ui/dialog/dialog";
import { RadioGroup, RadioGroupItem } from "@/registry/ui/radio-group/radio-group";

const reasons = [
  { value: "spoiler", label: "Spoils a later chapter" },
  { value: "rude", label: "Rude to other readers" },
  { value: "spam", label: "Spam or a link to a scan site" },
];

export default function DialogReportCommentVariant() {
  return (
    <Dialog defaultOpen>
      <DialogTrigger render={<Button variant="outline" />}>Report comment</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this comment?</DialogTitle>
          <DialogDescription>
            A moderator of the series reads every report. The comment stays hidden meanwhile.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup defaultValue="spoiler" aria-label="Reason">
          {reasons.map(({ value, label }) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem id={`report-comment-${value}`} value={value} />
              <label htmlFor={`report-comment-${value}`} className="text-sm">
                {label}
              </label>
            </div>
          ))}
        </RadioGroup>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button>Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
