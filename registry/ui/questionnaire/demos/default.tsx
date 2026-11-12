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
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/registry/ui/questionnaire/questionnaire";

const items = [
  {
    name: "series",
    required: true,
    choices: [{ value: "rooftop" }, { value: "tea" }, { value: "bell" }],
  },
  { name: "format", choices: [{ value: "print" }, { value: "phone" }, { value: "tablet" }] },
  {
    name: "pace",
    required: true,
    choices: [{ value: "weekly" }, { value: "monthly" }, { value: "volumes" }],
  },
] as const;

export default function QuestionnaireDefaultDemo() {
  const [sent, setSent] = React.useState<string | null>(null);

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <Questionnaire
        defaultItem="series"
        items={items}
        shortcuts="letters"
        aria-label="Reader survey"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSent(`Next series: ${data.get("series") ?? "none"}. Pace: ${data.get("pace")}.`);
        }}
      >
        <QuestionnaireProgress />
        <QuestionnaireItem name="series" required>
          <QuestionnaireTitle>Which series should run next?</QuestionnaireTitle>
          <QuestionnaireDescription>
            Choose one; press A, B or C to pick by key.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="rooftop">
              <span className="font-medium">Rooftop Runners</span>
              <QuestionnaireChoiceDescription>
                Action, a chase across the city every week.
              </QuestionnaireChoiceDescription>
            </QuestionnaireChoice>
            <QuestionnaireChoice value="tea">
              <span className="font-medium">Tea at Midnight</span>
              <QuestionnaireChoiceDescription>
                Slice of life in a café that opens at night.
              </QuestionnaireChoiceDescription>
            </QuestionnaireChoice>
            <QuestionnaireChoice value="bell">
              <span className="font-medium">The Ninth Bell</span>
              <QuestionnaireChoiceDescription>
                Mystery, one bell and one clue per chapter.
              </QuestionnaireChoiceDescription>
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem name="format" multiple>
          <QuestionnaireTitle>Where do you read?</QuestionnaireTitle>
          <QuestionnaireDescription>Choose all that apply, or skip.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="print">In print</QuestionnaireChoice>
            <QuestionnaireChoice value="phone">On a phone</QuestionnaireChoice>
            <QuestionnaireChoice value="tablet">On a tablet</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem name="pace" required>
          <QuestionnaireTitle>How often do you read?</QuestionnaireTitle>
          <QuestionnaireDescription>Pick the closest one.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="weekly">Every week</QuestionnaireChoice>
            <QuestionnaireChoice value="monthly">Every month</QuestionnaireChoice>
            <QuestionnaireChoice value="volumes">When a volume comes out</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit>Send answers</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {sent}
      </p>
    </div>
  );
}
