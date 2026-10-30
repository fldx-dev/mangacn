"use client";

import { Button } from "@/registry/ui/button/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/ui/sheet/sheet";

export default function SheetBottomDemo() {
  return (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>Chapter list</SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Chapter list</SheetTitle>
          <SheetDescription>Volume 2 · 12 chapters · 3 unread.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
