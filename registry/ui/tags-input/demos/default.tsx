import { Field, FieldLabel } from "@/registry/ui/field/field";
import { TagsInput } from "@/registry/ui/tags-input/tags-input";

export default function TagsInputDefaultDemo() {
  return (
    <Field className="w-full max-w-sm">
      <FieldLabel htmlFor="tags-input-genres">Genres</FieldLabel>
      <TagsInput
        id="tags-input-genres"
        name="genres"
        defaultValue={["Action", "Mystery", "Slice of life"]}
        placeholder="Add a genre"
      />
    </Field>
  );
}
