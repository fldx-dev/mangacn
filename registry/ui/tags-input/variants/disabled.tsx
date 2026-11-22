import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/registry/ui/field/field";
import { TagsInput } from "@/registry/ui/tags-input/tags-input";

export default function TagsInputDisabledVariant() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Kaiju Diner: series details</CardTitle>
        <CardDescription>Volume 3 goes to the printer on Friday.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="tags-input-launch">Launch genres</FieldLabel>
            <TagsInput
              id="tags-input-launch"
              name="launch-genres"
              defaultValue={["Comedy", "Food", "Monsters"]}
              disabled
              aria-describedby="tags-input-launch-description"
            />
            <FieldDescription id="tags-input-launch-description">
              Locked since chapter 1 was published.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="tags-input-keywords">Search keywords</FieldLabel>
            <TagsInput
              id="tags-input-keywords"
              name="keywords"
              max={6}
              defaultValue={["diner", "giant monster", "night shift"]}
              placeholder="Add a keyword"
              aria-describedby="tags-input-keywords-description"
            />
            <FieldDescription id="tags-input-keywords-description">
              Up to 6 keywords; readers find the series by them.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
