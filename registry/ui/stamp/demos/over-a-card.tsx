import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card/card";
import { Stamp } from "@/registry/ui/stamp/stamp";

export default function StampOverACardDemo() {
  return (
    // The demo places the stamp: a relative wrapper, the stamp absolute over the card's corner.
    <div className="relative w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Chapter 12: Rooftop</CardTitle>
          <CardDescription>Inks checked by the editor on Friday.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>18 pages inked, tones and letters done. Ready for the printer.</p>
        </CardContent>
      </Card>
      <Stamp aria-label="Approved" className="absolute -top-6 -right-2" rotate={12}>
        <span lang="ja">承認</span>
      </Stamp>
    </div>
  );
}
