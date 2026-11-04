"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/ui/alert-dialog/alert-dialog";
import { Button } from "@/registry/ui/button/button";

const terms = [
  "Chapter 12 goes live for every reader at once, in every region where the series is licensed. Readers who follow the series get a notification.",
  "The pages are locked for editing for 24 hours after release, so translators work from the same version. Corrections after that ship as a revision.",
  "Comments open with the chapter. The moderation rules of the series apply, and reported comments are hidden until a moderator reviews them.",
  "Translations into the other languages of the series are published as they are approved, each with its own notification.",
  "The chapter counts towards this month's ranking from the moment it is published. Scheduled chapters count from their release date.",
];

export default function AlertDialogLongDemo() {
  return (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger render={<Button variant="outline" />}>Publish chapter</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish chapter 12?</AlertDialogTitle>
          <AlertDialogDescription>Read what happens when it goes live.</AlertDialogDescription>
        </AlertDialogHeader>
        {/* A long body scrolls in its own region, so the actions stay on screen at 360 px. */}
        <section
          aria-label="What publishing does"
          // A scrollable region must be reachable from the keyboard.
          // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region
          tabIndex={0}
          className="-mx-1 grid max-h-[min(40dvh,16rem)] gap-3 overflow-y-auto rounded-md px-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {terms.map((term) => (
            <p key={term}>{term}</p>
          ))}
        </section>
        <AlertDialogFooter>
          <AlertDialogCancel>Not yet</AlertDialogCancel>
          <AlertDialogAction>Publish</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
