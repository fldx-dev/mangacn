import { MultiSelect, type MultiSelectOption } from "@/registry/ui/multi-select/multi-select";

const tags: MultiSelectOption[] = [
  { value: "action", label: "Action", group: "Genre" },
  { value: "comedy", label: "Comedy", group: "Genre" },
  { value: "mystery", label: "Mystery", group: "Genre" },
  { value: "shonen", label: "Shōnen", group: "Demographic" },
  { value: "shojo", label: "Shōjo", group: "Demographic" },
  { value: "seinen", label: "Seinen", group: "Demographic" },
  { value: "one-shot", label: "One-shot", group: "Format" },
  { value: "yonkoma", label: "Yonkoma", group: "Format" },
  { value: "webtoon", label: "Webtoon", group: "Format", disabled: true },
];

export default function MultiSelectGroupsDemo() {
  return (
    <MultiSelect
      options={tags}
      defaultValue={["action", "seinen"]}
      maxSelected={3}
      placeholder="Up to 3 tags"
      aria-label="Tags"
      className="max-w-72"
    />
  );
}
