"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/registry/ui/button/button";
import { Toaster } from "@/registry/ui/sonner/sonner";

export default function SonnerDefaultDemo() {
  // One toast on arrival, so the stage shows a card; the fixed id keeps a double effect
  // (React's development mode) from stacking a second one.
  useEffect(() => {
    toast("Chapter 12 saved", {
      id: "sonner-default",
      description: "Reading resumes on page 3.",
      duration: Number.POSITIVE_INFINITY,
    });
  }, []);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => toast("Page 3 bookmarked", { description: "Find it under Bookmarks." })}
      >
        Bookmark page
      </Button>
      <Toaster />
    </>
  );
}
