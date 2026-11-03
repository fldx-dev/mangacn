import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/registry/ui/collapsible/collapsible";

// Inside a card the collapsible needs no outline of its own: the card draws it.
export default function CollapsibleCardDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Chapter 12: Rooftop</CardTitle>
        <CardDescription>18 pages, inked and lettered.</CardDescription>
      </CardHeader>
      <CardContent>
        <Collapsible defaultOpen>
          <CollapsibleTrigger variant="glyph" className="w-full">
            Credits
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="flex flex-col gap-1 pt-2 text-sm">
              <li>Story and art: Aoi Mori</li>
              <li>Tones: Ren Kato</li>
              <li>Letters: Sam Ito</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
