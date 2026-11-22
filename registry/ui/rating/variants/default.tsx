import { Field, FieldGroup, FieldLabel } from "@/registry/ui/field/field";
import { Rating } from "@/registry/ui/rating/rating";
import { Textarea } from "@/registry/ui/textarea/textarea";

export default function RatingDefaultVariant() {
  return (
    <form className="w-full max-w-sm">
      <FieldGroup>
        <Field>
          <FieldLabel id="rating-variant-label">Your rating</FieldLabel>
          <Rating
            aria-labelledby="rating-variant-label"
            name="rating"
            defaultValue={4}
            step={0.5}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="rating-variant-review">Review</FieldLabel>
          <Textarea
            id="rating-variant-review"
            name="review"
            defaultValue="The diner fight in chapter 12 is worth the whole volume."
          />
        </Field>
      </FieldGroup>
    </form>
  );
}
