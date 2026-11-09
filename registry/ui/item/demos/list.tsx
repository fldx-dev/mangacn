import { Fragment } from "react";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/registry/ui/item/item";

const chapters = [
  { title: "Ch. 12: Last Order", pages: 24 },
  { title: "Ch. 11: Night Shift", pages: 22 },
  { title: "Ch. 10: The Big Tip", pages: 26 },
];

export default function ItemListDemo() {
  return (
    <ItemGroup aria-label="Chapters" className="max-w-sm gap-0">
      {chapters.map((chapter, index) => (
        <Fragment key={chapter.title}>
          {/* A divider between list items is decoration, not a list child. */}
          {index > 0 && <ItemSeparator aria-hidden="true" />}
          <Item role="listitem" size="sm">
            <ItemContent>
              <ItemTitle>{chapter.title}</ItemTitle>
              <ItemDescription>{chapter.pages} pages</ItemDescription>
            </ItemContent>
          </Item>
        </Fragment>
      ))}
    </ItemGroup>
  );
}
