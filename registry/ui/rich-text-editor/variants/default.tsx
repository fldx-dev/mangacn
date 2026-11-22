import { RichTextEditor } from "@/registry/ui/rich-text-editor/rich-text-editor";

const note =
  "<h3>Author's note</h3><p>Chapter 12 took <strong>three weeks</strong> of pencils. See you in <em>Kyoto</em>!</p>";

export default function RichTextEditorDefaultVariant() {
  return (
    <RichTextEditor
      aria-label="Author's note"
      name="note"
      defaultValue={note}
      className="max-w-lg"
    />
  );
}
