"use client";

import * as React from "react";
import { Button } from "@/registry/ui/button/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/ui/field/field";
import { RichTextEditor } from "@/registry/ui/rich-text-editor/rich-text-editor";

const MAX = 280;

export default function RichTextEditorFormDemo() {
  const [length, setLength] = React.useState(0);
  const [error, setError] = React.useState("");
  const [sent, setSent] = React.useState("");
  return (
    <form
      className="flex w-full max-w-lg flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const summary = String(new FormData(event.currentTarget).get("summary") ?? "");
        if (summary === "") setError("Write a summary before you send it.");
        else if (length > MAX) setError(`Keep the summary to ${MAX} characters.`);
        else setSent(summary);
      }}
    >
      <Field data-invalid={error !== "" || undefined}>
        <FieldLabel id="rich-text-editor-summary-label" htmlFor="rich-text-editor-summary">
          Chapter summary
        </FieldLabel>
        <RichTextEditor
          id="rich-text-editor-summary"
          aria-labelledby="rich-text-editor-summary-label"
          aria-describedby={
            error
              ? "rich-text-editor-summary-count rich-text-editor-summary-error"
              : "rich-text-editor-summary-count"
          }
          aria-invalid={error !== ""}
          name="summary"
          placeholder="What happens in this chapter?"
          onValueChange={(_html, { text }) => {
            setLength(text.length);
            setSent("");
            setError("");
          }}
        />
        <FieldDescription id="rich-text-editor-summary-count" aria-live="polite">
          {length} / {MAX} characters
        </FieldDescription>
        {error && <FieldError id="rich-text-editor-summary-error">{error}</FieldError>}
      </Field>
      <Button type="submit" className="self-start">
        Send to the editor
      </Button>
      {sent && (
        <p role="status" className="text-sm text-muted-foreground">
          Sent {sent.length} characters of HTML.
        </p>
      )}
    </form>
  );
}
