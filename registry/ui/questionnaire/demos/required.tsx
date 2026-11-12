"use client";

import * as React from "react";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/registry/ui/questionnaire/questionnaire";

const items = [
  {
    name: "plan",
    required: true,
    choices: [{ value: "reader" }, { value: "collector" }, { value: "studio", disabled: true }],
  },
] as const;

export default function QuestionnaireRequiredDemo() {
  const [plan, setPlan] = React.useState<string | null>(null);

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Questionnaire
        items={items}
        aria-label="Subscription"
        onSubmit={(event) => {
          event.preventDefault();
          setPlan(`Subscribed: ${new FormData(event.currentTarget).get("plan")}.`);
        }}
      >
        <QuestionnaireItem name="plan" required>
          <QuestionnaireTitle>Choose a subscription</QuestionnaireTitle>
          <QuestionnaireDescription>
            Required. Send it empty to see the error; Studio is sold out.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="reader">
              <span className="font-medium">Reader</span>
              <QuestionnaireChoiceDescription>
                Every chapter, the week it runs.
              </QuestionnaireChoiceDescription>
            </QuestionnaireChoice>
            <QuestionnaireChoice value="collector">
              <span className="font-medium">Collector</span>
              <QuestionnaireChoiceDescription>
                Chapters, plus each volume in print.
              </QuestionnaireChoiceDescription>
            </QuestionnaireChoice>
            <QuestionnaireChoice value="studio" disabled>
              <span className="font-medium">Studio</span>
              <QuestionnaireChoiceDescription>
                Signed originals. Sold out.
              </QuestionnaireChoiceDescription>
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnaireSubmit>Subscribe</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {plan}
      </p>
    </div>
  );
}
