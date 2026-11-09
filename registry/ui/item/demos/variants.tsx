import { Item, ItemContent, ItemDescription, ItemTitle } from "@/registry/ui/item/item";

const variants = [
  { variant: "default", description: "No outline, for rows in a list." },
  { variant: "outline", description: "A paper card in a heavy outline." },
  { variant: "muted", description: "On the lightest tone." },
] as const;

export default function ItemVariantsDemo() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      {variants.map(({ variant, description }) => (
        <Item key={variant} variant={variant}>
          <ItemContent>
            <ItemTitle>{variant}</ItemTitle>
            <ItemDescription>{description}</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </div>
  );
}
