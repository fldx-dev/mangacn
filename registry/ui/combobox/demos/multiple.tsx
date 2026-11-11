"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/registry/ui/combobox/combobox";

const genres = ["Action", "Comedy", "Drama", "Horror", "Mystery", "Romance", "Sports"];

export default function ComboboxMultipleDemo() {
  const anchor = useComboboxAnchor();
  return (
    <div className="flex min-h-80 w-full items-start justify-center">
      <Combobox multiple items={genres} defaultValue={["Action", "Mystery"]} defaultOpen>
        <ComboboxChips ref={anchor} className="w-full max-w-72">
          <ComboboxValue>
            {(values: string[]) => (
              <React.Fragment>
                {values.map((value) => (
                  <ComboboxChip key={value}>{value}</ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder="Add a genre" aria-label="Genres" />
              </React.Fragment>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No genres found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
