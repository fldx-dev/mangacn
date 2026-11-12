"use client";

import * as React from "react";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireItem,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/registry/ui/questionnaire/questionnaire";

const items = [
  {
    name: "extras",
    choices: [{ value: "sketches" }, { value: "notes" }, { value: "omake" }, { value: "poster" }],
  },
] as const;

export default function QuestionnaireMultipleDemo() {
  const [picked, setPicked] = React.useState<string | null>(null);

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Questionnaire
        items={items}
        shortcuts="numbers"
        aria-label="Volume extras"
        onSubmit={(event) => {
          event.preventDefault();
          const extras = new FormData(event.currentTarget).getAll("extras");
          setPicked(extras.length ? `Saved: ${extras.join(", ")}.` : "Saved: no extras.");
        }}
      >
        <QuestionnaireItem name="extras" multiple>
          <QuestionnaireTitle>What should the next volume include?</QuestionnaireTitle>
          <QuestionnaireDescription>
            Choose any number, press 1 to 4, or skip.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="sketches" defaultChecked>
              Character sketches
            </QuestionnaireChoice>
            <QuestionnaireChoice value="notes">Author's notes</QuestionnaireChoice>
            <QuestionnaireChoice value="omake" defaultChecked>
              A bonus omake chapter
            </QuestionnaireChoice>
            <QuestionnaireChoice value="poster">A fold-out poster</QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnaireSkip />
          <QuestionnaireSubmit>Save</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {picked}
      </p>
    </div>
  );
}
