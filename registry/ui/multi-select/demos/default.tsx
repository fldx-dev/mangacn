import { Field, FieldDescription, FieldLabel } from "@/registry/ui/field/field";
import { MultiSelect } from "@/registry/ui/multi-select/multi-select";

const genres = [
  { value: "action", label: "Action" },
  { value: "comedy", label: "Comedy" },
  { value: "drama", label: "Drama" },
  { value: "horror", label: "Horror" },
  { value: "mystery", label: "Mystery" },
  { value: "romance", label: "Romance" },
  { value: "slice-of-life", label: "Slice of life" },
  { value: "sports", label: "Sports" },
];

export default function MultiSelectDefaultDemo() {
  return (
    <Field className="w-full max-w-72">
      <FieldLabel htmlFor="multi-select-demo-genres">Genres</FieldLabel>
      <MultiSelect
        id="multi-select-demo-genres"
        options={genres}
        defaultValue={["action", "mystery"]}
        placeholder="Add a genre"
        name="genres"
        aria-describedby="multi-select-demo-genres-hint"
      />
      <FieldDescription id="multi-select-demo-genres-hint">
        Readers filter the shelf by these.
      </FieldDescription>
    </Field>
  );
}
