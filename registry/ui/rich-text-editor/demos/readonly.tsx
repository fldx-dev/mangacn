import { RichTextEditor } from "@/registry/ui/rich-text-editor/rich-text-editor";

const stored =
  "<h3>Editor's feedback</h3><blockquote><p>The rooftop spread works. Keep the rain light on page 14.</p></blockquote><ol><li><p>Letter the SFX by hand.</p></li><li><p>Move the title drop to page 2.</p></li></ol><hr><p>Due <s>Friday</s> Monday.</p>";

export default function RichTextEditorReadonlyDemo() {
  return (
    <RichTextEditor
      aria-label="Editor's feedback"
      editable={false}
      defaultValue={stored}
      className="max-w-lg"
    />
  );
}
