"use client";

import { Share2Icon } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import { Input } from "@/registry/ui/input/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/ui/popover/popover";

const link = "https://www.mangacn.com/read/rooftop-runners/12";

export default function PopoverShareLinkVariant() {
  return (
    <Popover defaultOpen>
      <PopoverTrigger render={<Button variant="outline" />}>
        <Share2Icon />
        Share
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Share chapter 12</PopoverTitle>
          <PopoverDescription>Anyone with the link opens it at page 1.</PopoverDescription>
        </PopoverHeader>
        <div className="flex items-center gap-2">
          <Input aria-label="Chapter link" readOnly defaultValue={link} className="min-w-0" />
          <CopyButton value={link} variant="outline" labels={{ copy: "Copy link" }} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
