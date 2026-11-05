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

const CHAPTERS = [
  { number: 9, title: "The flooded shrine" },
  { number: 10, title: "Paper lanterns" },
  { number: 11, title: "A borrowed sword" },
  { number: 12, title: "Night market", current: true },
];

export default function DrawerDefaultDemo() {
  return (
    <Drawer defaultOpen showSwipeHandle>
      <DrawerTrigger render={<Button variant="outline" />}>Chapters</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto flex w-full max-w-sm flex-col">
          <DrawerHeader>
            <DrawerTitle>Volume 2</DrawerTitle>
            <DrawerDescription>Pick a chapter to keep reading.</DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-1 p-4">
            {CHAPTERS.map(({ number, title, current }) => (
              <DrawerClose
                key={number}
                render={
                  <Button
                    variant={current ? "default" : "ghost"}
                    aria-current={current ? "true" : undefined}
                    className="justify-between"
                  />
                }
              >
                <span>
                  Ch. {number} · {title}
                </span>
                {current ? <span>Page 3</span> : null}
              </DrawerClose>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
