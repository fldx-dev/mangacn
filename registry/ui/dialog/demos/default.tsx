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
import { Input } from "@/registry/ui/input/input";

export default function DialogDefaultDemo() {
  return (
    <Dialog defaultOpen>
      <DialogTrigger render={<Button variant="outline" />}>Rename chapter</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename chapter</DialogTitle>
          <DialogDescription>Readers see the new title in the table of contents.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <label htmlFor="dialog-demo-title" className="text-sm font-medium">
            Title
          </label>
          <Input id="dialog-demo-title" defaultValue="Rooftop" />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
