import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/registry/ui/field/field";
import { Input } from "@/registry/ui/input/input";

const rows = [
  {
    id: "responsive-rows-pen-name",
    label: "Pen name",
    description: "Printed on every cover.",
    value: "Mizuki Ren",
  },
  {
    id: "responsive-rows-studio",
    label: "Studio",
    description: "Credited at the end of a chapter.",
    value: "Paper Crane Works",
  },
  {
    id: "responsive-rows-site",
    label: "Website",
    description: "Linked from your profile.",
    value: "mizuki.example.com",
  },
];

export default function FieldResponsiveRowsVariant() {
  return (
    <FieldSet className="w-full max-w-xl">
      <FieldLegend>Profile</FieldLegend>
      <FieldDescription>How readers see you on the series page.</FieldDescription>
      <FieldGroup>
        {rows.map((row) => (
          <Field key={row.id} orientation="responsive">
            <FieldContent>
              <FieldLabel htmlFor={row.id}>{row.label}</FieldLabel>
              <FieldDescription>{row.description}</FieldDescription>
            </FieldContent>
            <div className="@md/field-group:w-56">
              <Input id={row.id} defaultValue={row.value} />
            </div>
          </Field>
        ))}
      </FieldGroup>
    </FieldSet>
  );
}
