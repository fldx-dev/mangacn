import { Badge } from "@/registry/ui/badge/badge";
import { Button } from "@/registry/ui/button/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/ui/card/card";

// Any image URL works; this night market under lanterns is an inline SVG, so the variant needs
// no files.
const art = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
<defs><pattern id="t" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1" fill="#8a8a8a"/></pattern></defs>
<rect width="320" height="180" fill="#ededed"/>
<rect width="320" height="110" fill="url(#t)"/>
<path d="M0 40 Q160 70 320 40" fill="none" stroke="#222" stroke-width="2"/>
<g fill="#fafafa" stroke="#222" stroke-width="2"><ellipse cx="60" cy="58" rx="10" ry="13"/><ellipse cx="130" cy="66" rx="10" ry="13"/><ellipse cx="200" cy="66" rx="10" ry="13"/><ellipse cx="270" cy="56" rx="10" ry="13"/></g>
<path d="M20 180 L20 120 L110 100 L110 180 Z M210 180 L210 100 L300 120 L300 180 Z" fill="#555"/>
<path d="M0 160 L320 150 L320 180 L0 180 Z" fill="#222"/>
</svg>`;
const cover = `data:image/svg+xml,${encodeURIComponent(art)}`;

export default function CardCoverImageVariant() {
  return (
    // An <img> right after the frame becomes the card's top: no top padding, rounded corners.
    <Card className="w-full max-w-sm">
      {/* biome-ignore lint/performance/noImgElement: framework-free; any image URL works. */}
      <img
        src={cover}
        alt="Lanterns strung over a night market"
        className="aspect-video w-full object-cover"
      />
      <CardHeader>
        <CardTitle>Night Market</CardTitle>
        <CardDescription>By Mika Kondo, 48 chapters</CardDescription>
        <CardAction>
          <Badge variant="secondary">Ongoing</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>A courier delivers to stalls that only open after midnight, and one never closes.</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button className="flex-1">Read chapter 1</Button>
        <Button variant="outline">Follow</Button>
      </CardFooter>
    </Card>
  );
}
