import { Button } from "@/registry/ui/button/button";
import { Field, FieldLabel } from "@/registry/ui/field/field";
import { MultiSelect } from "@/registry/ui/multi-select/multi-select";

const statuses = [
  { value: "reading", label: "Reading" },
  { value: "plan-to-read", label: "Plan to read" },
  { value: "completed", label: "Completed" },
  { value: "on-hold", label: "On hold" },
  { value: "dropped", label: "Dropped" },
];

const demographics = [
  { value: "shonen", label: "Shōnen" },
  { value: "shojo", label: "Shōjo" },
  { value: "seinen", label: "Seinen" },
  { value: "josei", label: "Josei" },
];

export default function MultiSelectFilterBarVariant() {
  return (
    <form aria-label="Filter your library" className="w-full max-w-2xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor="multi-select-filter-status">Status</FieldLabel>
          <MultiSelect
            id="multi-select-filter-status"
            options={statuses}
            defaultValue={["reading", "on-hold"]}
            placeholder="Any status"
            name="status"
          />
        </Field>
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor="multi-select-filter-demographic">Demographic</FieldLabel>
          <MultiSelect
            id="multi-select-filter-demographic"
            options={demographics}
            defaultValue={["seinen"]}
            placeholder="Any demographic"
            name="demographic"
          />
        </Field>
        <Button type="submit" className="sm:shrink-0">
          Apply filters
        </Button>
      </div>
    </form>
  );
}
