import { Field, FieldDescription, FieldLabel } from "@/registry/ui/field/field";
import { NativeSelect, NativeSelectOption } from "@/registry/ui/native-select/native-select";

export default function NativeSelectInAFieldDemo() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel htmlFor="native-select-demo-schedule">Release schedule</FieldLabel>
      <NativeSelect
        id="native-select-demo-schedule"
        defaultValue="weekly"
        className="w-full"
        aria-describedby="native-select-demo-schedule-hint"
      >
        <NativeSelectOption value="weekly">Weekly</NativeSelectOption>
        <NativeSelectOption value="monthly">Monthly</NativeSelectOption>
        <NativeSelectOption value="irregular">Irregular</NativeSelectOption>
      </NativeSelect>
      <FieldDescription id="native-select-demo-schedule-hint">
        When new chapters go up on the series page.
      </FieldDescription>
    </Field>
  );
}
