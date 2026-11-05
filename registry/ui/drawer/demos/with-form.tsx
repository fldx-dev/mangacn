"use client";

import { Button } from "@/registry/ui/button/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/registry/ui/drawer/drawer";
import { Input } from "@/registry/ui/input/input";
import { Textarea } from "@/registry/ui/textarea/textarea";

export default function DrawerWithFormDemo() {
  return (
    <Drawer defaultOpen>
      <DrawerTrigger render={<Button variant="outline" />}>Add bookmark</DrawerTrigger>
      <DrawerContent>
        <form
          className="mx-auto flex w-full max-w-sm flex-col"
          onSubmit={(event) => event.preventDefault()}
        >
          <DrawerHeader>
            <DrawerTitle>Bookmark page 3</DrawerTitle>
            <DrawerDescription>Chapter 12 · Night market.</DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-4 p-4">
            <div className="grid gap-2">
              <label htmlFor="bookmark-name" className="text-sm font-medium">
                Name
              </label>
              <Input id="bookmark-name" defaultValue="The lantern reveal" />
            </div>
            <div className="grid gap-2">
              <label htmlFor="bookmark-note" className="text-sm font-medium">
                Note
              </label>
              <Textarea id="bookmark-note" placeholder="What happens on this page?" />
            </div>
          </div>
          <DrawerFooter>
            <Button type="submit">Save bookmark</Button>
            <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
