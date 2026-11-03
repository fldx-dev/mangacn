"use client";

import { useState } from "react";
import { InkMark } from "@/registry/ui/ink-mark/ink-mark";
import { Switch } from "@/registry/ui/switch/switch";

export default function InkMarkRevealDemo() {
  const [show, setShow] = useState(true);
  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex items-center gap-2">
        <Switch id="ink-mark-reveal" checked={show} onCheckedChange={setShow} />
        <label htmlFor="ink-mark-reveal" className="text-sm">
          Mark the answer
        </label>
      </div>
      <p className="max-w-sm text-lg">
        The culprit was{" "}
        <InkMark kind="circle" color="spot" show={show}>
          the butler
        </InkMark>{" "}
        all along.
      </p>
    </div>
  );
}
