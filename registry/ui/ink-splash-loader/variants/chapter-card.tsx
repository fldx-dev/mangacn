import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card/card";
import { InkSplashLoader } from "@/registry/ui/ink-splash-loader/ink-splash-loader";

export default function InkSplashLoaderChapterCardVariant() {
  return (
    // The card keeps its header while the pages load, and the loader holds the space they fill.
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Chapter 48: Last Stop</CardTitle>
        <CardDescription>Night Bus, 22 pages</CardDescription>
      </CardHeader>
      <CardContent className="grid min-h-40 place-items-center gap-3 halftone-light">
        <div className="flex flex-col items-center gap-3 bg-paper px-4 py-3">
          <InkSplashLoader size="lg" label="Loading chapter 48" />
          <p className="text-sm" aria-hidden="true">
            Loading pages…
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
