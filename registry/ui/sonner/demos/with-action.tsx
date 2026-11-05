"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/registry/ui/button/button";
import { Toaster } from "@/registry/ui/sonner/sonner";

function deleteChapter(options: { id?: string; duration?: number } = {}) {
  toast("Chapter 12 removed from Reading", {
    description: "It is still in your library.",
    action: { label: "Undo", onClick: () => toast.success("Chapter 12 is back in Reading") },
    ...options,
  });
}

export default function SonnerWithActionDemo() {
  useEffect(() => {
    deleteChapter({ id: "sonner-with-action", duration: Number.POSITIVE_INFINITY });
  }, []);

  return (
    <>
      <Button variant="outline" onClick={() => deleteChapter()}>
        Remove chapter
      </Button>
      <Toaster closeButton />
    </>
  );
}
