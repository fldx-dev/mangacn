import { Button } from "@/registry/ui/button/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/registry/ui/item/item";

export default function ItemDefaultDemo() {
  return (
    <Item variant="outline" className="max-w-sm">
      <ItemContent>
        <ItemTitle>Chapter 12: Last Order</ItemTitle>
        <ItemDescription>24 pages · read 3 days ago</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm">
          Read
        </Button>
      </ItemActions>
    </Item>
  );
}
