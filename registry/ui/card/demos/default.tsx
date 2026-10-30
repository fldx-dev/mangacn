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

export default function CardDefaultDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Chapter 12: Rooftop</CardTitle>
        <CardDescription>Inks due Friday. Tones and letters after.</CardDescription>
        <CardAction>
          <Button variant="link">Open</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>18 pages pencilled, 11 inked. Page 7 still needs the speed lines on the jump.</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Send to the editor</Button>
      </CardFooter>
    </Card>
  );
}
