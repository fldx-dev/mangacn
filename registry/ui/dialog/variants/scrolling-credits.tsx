"use client";

import { Button } from "@/registry/ui/button/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/ui/dialog/dialog";

const credits = [
  { role: "Story and art", name: "Aoi Takahashi" },
  { role: "Assistant, backgrounds", name: "Ren Morita" },
  { role: "Assistant, screentones", name: "Yui Hayashi" },
  { role: "Lettering", name: "Kenji Ota" },
  { role: "Sound effects", name: "Kenji Ota" },
  { role: "Editor", name: "Mika Sato" },
  { role: "Translation", name: "Sam Ellis" },
  { role: "Proofreading", name: "Nora Diaz" },
  { role: "Cover design", name: "Hana Ito" },
  { role: "Logo", name: "Hana Ito" },
];

export default function DialogScrollingCreditsVariant() {
  return (
    <Dialog defaultOpen>
      <DialogTrigger render={<Button variant="outline" />}>Credits</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rooftop Runners, volume 2</DialogTitle>
          <DialogDescription>Everyone who made this volume.</DialogDescription>
        </DialogHeader>
        {/* A long list scrolls in its own region, so the footer stays on screen at 360 px. */}
        <section
          aria-label="Credits"
          // A scrollable region must be reachable from the keyboard.
          // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region
          tabIndex={0}
          className="-mx-1 max-h-[min(40dvh,14rem)] overflow-y-auto rounded-md px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <dl className="grid gap-2">
            {credits.map(({ role, name }) => (
              <div key={role} className="grid gap-0.5">
                <dt className="text-muted-foreground">{role}</dt>
                <dd className="font-medium">{name}</dd>
              </div>
            ))}
          </dl>
        </section>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
