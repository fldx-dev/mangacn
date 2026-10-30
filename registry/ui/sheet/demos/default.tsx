"use client";

import { Button } from "@/registry/ui/button/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/ui/sheet/sheet";

export default function SheetDefaultDemo() {
  return (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>Reader settings</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Reader settings</SheetTitle>
          <SheetDescription>Choose how pages turn and how panels are shown.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 px-4 text-sm">
          <p>Reading direction: right to left.</p>
          <p>Page layout: double spread on wide screens.</p>
        </div>
        <SheetFooter>
          <Button>Save</Button>
          <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
