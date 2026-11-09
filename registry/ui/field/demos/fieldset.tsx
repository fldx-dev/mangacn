import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/registry/ui/field/field";
import { RadioGroup, RadioGroupItem } from "@/registry/ui/radio-group/radio-group";

const modes = [
  { value: "page", title: "Page by page", description: "One page at a time, tap to turn." },
  { value: "scroll", title: "Long strip", description: "Every page in one scroll." },
];

export default function FieldFieldsetDemo() {
  return (
    <FieldSet className="w-full max-w-sm">
      <FieldLegend>Reading</FieldLegend>
      <FieldDescription>How chapters open on this device.</FieldDescription>
      <RadioGroup defaultValue="page" aria-label="Reading mode">
        {modes.map((mode) => (
          <FieldLabel key={mode.value} htmlFor={`field-demo-${mode.value}`}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{mode.title}</FieldTitle>
                <FieldDescription>{mode.description}</FieldDescription>
              </FieldContent>
              <RadioGroupItem value={mode.value} id={`field-demo-${mode.value}`} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
      <FieldSeparator>and</FieldSeparator>
      <Field orientation="horizontal">
        <Checkbox id="field-demo-notify" defaultChecked />
        <FieldLabel htmlFor="field-demo-notify">Tell me when a chapter drops</FieldLabel>
      </Field>
    </FieldSet>
  );
}
