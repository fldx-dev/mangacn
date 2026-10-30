"use client";

import { Button } from "@/registry/ui/button/button";
import { Input } from "@/registry/ui/input/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/ui/popover/popover";

export default function PopoverDefaultDemo() {
  return (
    <Popover defaultOpen>
      <PopoverTrigger render={<Button variant="outline" />}>Jump to page</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Jump to page</PopoverTitle>
          <PopoverDescription>Chapter 12 has 18 pages.</PopoverDescription>
        </PopoverHeader>
        <Input aria-label="Page number" type="number" defaultValue={7} />
      </PopoverContent>
    </Popover>
  );
}
