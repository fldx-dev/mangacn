"use client";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "@/registry/ui/combobox/combobox";

const magazines = [
  { value: "Weekly", items: ["Rooftop Ronin", "Salt Tide", "Kaiju Kindergarten"] },
  { value: "Monthly", items: ["Paper Moon Café", "The Last Tram"] },
  { value: "Web", items: ["Night Shift Shrine", "Ink Fox"] },
];

export default function ComboboxWithGroupsDemo() {
  return (
    <div className="flex min-h-80 w-full items-start justify-center">
      <Combobox items={magazines} defaultOpen>
        <ComboboxInput placeholder="Pick a series" aria-label="Series" className="w-56" />
        <ComboboxContent>
          <ComboboxEmpty>No series found.</ComboboxEmpty>
          <ComboboxList>
            {(group: (typeof magazines)[number], index: number) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel>{group.value}</ComboboxLabel>
                <ComboboxCollection>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
                {index < magazines.length - 1 && <ComboboxSeparator />}
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
