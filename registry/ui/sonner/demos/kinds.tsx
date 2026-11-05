"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/registry/ui/button/button";
import { Toaster } from "@/registry/ui/sonner/sonner";

const KINDS = [
  {
    kind: "info",
    title: "Chapter 13 drops Friday",
    description: "We will remind you at 9:00.",
  },
  {
    kind: "warning",
    title: "Offline copy is 3 chapters behind",
    description: "Sync on Wi-Fi to catch up.",
  },
  { kind: "error", title: "Page 7 failed to load", description: "Check the connection and retry." },
  { kind: "success", title: "Volume 2 downloaded", description: "12 chapters ready offline." },
] as const;

export default function SonnerKindsDemo() {
  // All four on arrival, expanded, so the stage shows every ink glyph; with `richColors` only
  // the error turns spot red.
  useEffect(() => {
    for (const { kind, title, description } of KINDS) {
      toast[kind](title, {
        id: `sonner-kinds-${kind}`,
        description,
        duration: Number.POSITIVE_INFINITY,
      });
    }
  }, []);

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2">
        {KINDS.map(({ kind, title, description }) => (
          <Button
            key={kind}
            variant="outline"
            size="sm"
            onClick={() => toast[kind](title, { description })}
          >
            {kind[0].toUpperCase() + kind.slice(1)}
          </Button>
        ))}
      </div>
      <Toaster richColors expand visibleToasts={4} position="top-center" />
    </>
  );
}
