import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card/card";

const cards = [
  { shadow: "none", title: "No shadow", description: "The default: outline and paper only." },
  { shadow: "ink", title: "Ink shadow", description: "A solid ink block behind the panel." },
  { shadow: "hatch", title: "Hatched shadow", description: "Pen hatching instead of a fill." },
] as const;

export default function CardVariantsDemo() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      {cards.map(({ shadow, title, description }) => (
        <Card key={shadow} shadow={shadow}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Small</CardTitle>
          <CardDescription>size="sm" tightens the spacing.</CardDescription>
        </CardHeader>
        <CardContent>Thumbnail notes fit here.</CardContent>
      </Card>
    </div>
  );
}
