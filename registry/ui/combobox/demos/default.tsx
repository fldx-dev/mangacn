"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/registry/ui/combobox/combobox";

const series = [
  "Rooftop Ronin",
  "Paper Moon Café",
  "Salt Tide",
  "The Last Tram",
  "Kaiju Kindergarten",
  "Night Shift Shrine",
];

export default function ComboboxDefaultDemo() {
  return (
    <div className="flex min-h-72 w-full items-start justify-center">
      <Combobox items={series} defaultOpen>
        <ComboboxInput placeholder="Pick a series" aria-label="Series" className="w-56" />
        <ComboboxContent>
          <ComboboxEmpty>No series found.</ComboboxEmpty>
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
