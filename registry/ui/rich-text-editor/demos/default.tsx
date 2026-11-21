import { Field, FieldLabel } from "@/registry/ui/field/field";
import { RichTextEditor } from "@/registry/ui/rich-text-editor/rich-text-editor";

const note =
  "<h2>Author's note</h2><p>Chapter 12 took <strong>three weeks</strong> of pencils. The diner fight was drawn twice: the first version had <em>too many</em> speed lines.</p><ul><li><p>Thanks to Aoi for the screentones.</p></li><li><p>Next week: the rooftop.</p></li></ul><p>See you in Kyoto!</p>";

export default function RichTextEditorDefaultDemo() {
  return (
    <Field className="w-full max-w-lg">
      <FieldLabel id="rich-text-editor-note-label" htmlFor="rich-text-editor-note">
        Author's note
      </FieldLabel>
      <RichTextEditor
        id="rich-text-editor-note"
        aria-labelledby="rich-text-editor-note-label"
        name="note"
        defaultValue={note}
      />
    </Field>
  );
}
