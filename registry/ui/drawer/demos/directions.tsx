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

// One drawer per side; the right one starts open so the stage shows a side drawer's edge.
const SIDES = [
  { label: "Top", direction: "up" },
  { label: "Right", direction: "right", open: true },
  { label: "Bottom", direction: "down" },
  { label: "Left", direction: "left" },
] as const;

export default function DrawerDirectionsDemo() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SIDES.map(({ label, direction, ...side }) => (
        <Drawer
          key={direction}
          swipeDirection={direction}
          defaultOpen={"open" in side}
          showSwipeHandle
        >
          <DrawerTrigger render={<Button variant="outline" />}>{label}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Panel notes</DrawerTitle>
              <DrawerDescription>
                Opens from the {label.toLowerCase()} edge; swipe it back to close.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-4">
              <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  );
}
