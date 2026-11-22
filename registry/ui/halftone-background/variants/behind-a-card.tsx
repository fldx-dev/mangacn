import { Button } from "@/registry/ui/button/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/ui/card/card";
import { HalftoneBackground } from "@/registry/ui/halftone-background/halftone-background";

export default function HalftoneBackgroundBehindACardVariant() {
  return (
    // The screen fills the hero; the card's own paper fill covers it, so the dots frame the card.
    <section
      aria-labelledby="series-hero-title"
      className="relative isolate grid w-full max-w-2xl place-items-center bg-paper px-6 py-12 sm:px-12"
    >
      <HalftoneBackground tone="dark" size="sm" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h2 id="series-hero-title" className="font-display text-2xl uppercase">
              Night Bus
            </h2>
          </CardTitle>
          <CardDescription>Weekly series by Hana Ito, 48 chapters</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The last bus out of the city never reaches its final stop.</p>
        </CardContent>
        <CardFooter>
          <Button nativeButton={false} role="link" render={<a href="#chapter-1" />}>
            Read chapter 1
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
