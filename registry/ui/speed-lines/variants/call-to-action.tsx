import { Button } from "@/registry/ui/button/button";
import { SpeedLines } from "@/registry/ui/speed-lines/speed-lines";

export default function SpeedLinesCallToActionVariant() {
  return (
    // Toned streaks run across the banner and trail off to the left, behind the text and link.
    <section
      aria-labelledby="new-chapter-title"
      className="relative isolate flex w-full max-w-2xl flex-col items-start gap-3 bg-paper p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <SpeedLines direction="left" density="dense" color="tone" />
      <div className="grid gap-1">
        <h2 id="new-chapter-title" className="w-fit bg-paper px-1 font-display text-2xl uppercase">
          Chapter 48 is out
        </h2>
        <p className="w-fit bg-paper px-1 text-sm">Night Bus, released today with 22 pages.</p>
      </div>
      <Button
        variant="sfx"
        size="lg"
        nativeButton={false}
        role="link"
        render={<a href="#chapter-48" />}
      >
        Read now
      </Button>
    </section>
  );
}
