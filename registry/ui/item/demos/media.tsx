import { BookOpenIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/registry/ui/item/item";

export default function ItemMediaDemo() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <BookOpenIcon aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Volume 3 is out</ItemTitle>
          <ItemDescription>Chapters 19 to 27, with a bonus short.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="ghost" size="icon-sm" aria-label="Open volume 3">
            <ChevronRightIcon />
          </Button>
        </ItemActions>
      </Item>
      <Item variant="muted">
        <ItemMedia variant="image">
          <span aria-hidden="true" className="block size-full bg-tone-2 halftone" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Kaiju Diner</ItemTitle>
          <ItemDescription>Weekly · 112 chapters</ItemDescription>
        </ItemContent>
      </Item>
    </div>
  );
}
