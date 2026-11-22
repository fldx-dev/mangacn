import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/registry/ui/field/field";

const tasks = [
  { id: "pencils", title: "Pencils", description: "All 18 pages roughed and cleaned.", done: true },
  { id: "inks", title: "Inks", description: "All 18 pages inked.", done: true },
  { id: "tones", title: "Tones", description: "Screentone the night scenes.", done: false },
  { id: "letters", title: "Letters", description: "Balloons and sound effects.", done: false },
];

export default function CheckboxTaskChecklistVariant() {
  return (
    <FieldSet className="w-full max-w-sm">
      <FieldLegend>Chapter 12 tasks</FieldLegend>
      <FieldGroup data-slot="checkbox-group">
        {tasks.map((task) => (
          <Field key={task.id} orientation="horizontal">
            <Checkbox id={`checkbox-task-checklist-${task.id}`} defaultChecked={task.done} />
            <FieldContent>
              <FieldLabel htmlFor={`checkbox-task-checklist-${task.id}`}>{task.title}</FieldLabel>
              <FieldDescription>{task.description}</FieldDescription>
            </FieldContent>
          </Field>
        ))}
        {/* Locked until the work above is done: disabled, and the field fades with it. */}
        <Field orientation="horizontal" data-disabled="true">
          <Checkbox id="checkbox-task-checklist-print" disabled />
          <FieldContent>
            <FieldLabel htmlFor="checkbox-task-checklist-print">Send to the printer</FieldLabel>
            <FieldDescription>Unlocks when every task above is ticked.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
