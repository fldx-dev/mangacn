import { GalleryVerticalEndIcon } from "lucide-react";
import { SignupForm } from "./components/signup-form";
import { FocusLines } from "@/components/focus-lines";
import { HalftoneBackground } from "@/components/halftone-background";
import { MangaFrame } from "@/components/manga-frame";
import { SfxText } from "@/components/sfx-text";

// Based on shadcn/ui signup-02 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's split screen in ink, as login-02: the studio's mark and the form on the left, and
// where stock shows a placeholder photo, a manga panel the items draw (a halftone screen, focus
// lines and one sound effect in a heavy ink frame). The panel is decoration, hidden from the
// accessibility tree, and keeps stock's place: the right column, from the lg breakpoint up. The
// page is the one `main`.

export default function SignupPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <GalleryVerticalEndIcon aria-hidden className="size-4" />
            Inkpot Studio
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div aria-hidden className="relative hidden items-center justify-center p-10 lg:flex">
        <MangaFrame aspect="3/4" className="w-full max-w-md">
          <HalftoneBackground tone="light" fade="radial" />
          <FocusLines length="long" />
          <SfxText size="lg" rotate={6}>
            Zawa!
          </SfxText>
        </MangaFrame>
      </div>
    </main>
  );
}
