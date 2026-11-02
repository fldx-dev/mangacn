"use client";

import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/registry/ui/button/button";

// An anchor drawn as a button. Base UI marks every non-native button `role="button"`, even an
// <a href>, so `role="link"` keeps it announced as the link it is.
export default function ButtonLinkDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button nativeButton={false} role="link" render={<a href="#chapter-12" />}>
        Read chapter 12
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
      <Button variant="outline" nativeButton={false} role="link" render={<a href="#chapters" />}>
        All chapters
      </Button>
    </div>
  );
}
