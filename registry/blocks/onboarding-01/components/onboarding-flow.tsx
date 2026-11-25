"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Link } from "@/lib/link";
import {
  ONBOARDING_MIN_GENRES,
  ONBOARDING_STEPS,
  type OnboardingAnswers,
  type OnboardingDevice,
  type OnboardingDirection,
  onboardingDefaults,
  onboardingDevices,
  onboardingDirections,
  onboardingGenres,
} from "./onboarding-data";

type Errors = Partial<Record<"name" | "genres" | "reminderTime", string>>;

/** The errors of one form step (0 Profile, 1 Interests, 2 Habits); empty when it is valid. */
export function validateOnboardingStep(step: number, answers: OnboardingAnswers): Errors {
  const errors: Errors = {};
  if (step === 0 && !answers.name.trim()) errors.name = "Enter your name.";
  if (step === 1 && answers.genres.length < ONBOARDING_MIN_GENRES) {
    errors.genres = `Pick at least ${ONBOARDING_MIN_GENRES} genres.`;
  }
  if (step === 2 && answers.reminder && !answers.reminderTime) {
    errors.reminderTime = "Set a time for the reminder.";
  }
  return errors;
}

/** "Step 2 of 4, Interests". */
export function onboardingStepLabel(step: number): string {
  return `Step ${step + 1} of ${ONBOARDING_STEPS.length}, ${ONBOARDING_STEPS[step]}`;
}

export interface OnboardingFlowProps {
  /**
   * The starting answers.
   * @default onboardingDefaults
   */
  defaultAnswers?: OnboardingAnswers;
  /** Where "Go to library" goes. @default "/library" */
  libraryHref?: string;
  /** Called with the answers when Finish completes the last form step. */
  onComplete?: (answers: OnboardingAnswers) => void;
}

/**
 * A first-run flow in a card: a linear stepper over three form steps and a summary. Next
 * validates the step (focus to the first invalid field), Back keeps the answers, and each step
 * change moves focus to the new step's heading and announces it.
 */
export function OnboardingFlow({
  defaultAnswers = onboardingDefaults,
  libraryHref = "/library",
  onComplete,
}: OnboardingFlowProps) {
  const id = React.useId();
  const [answers, setAnswers] = React.useState(defaultAnswers);
  const [step, setStep] = React.useState(0);
  // Steps before `reached` are completed and stay choosable after going Back.
  const [reached, setReached] = React.useState(0);
  const [errors, setErrors] = React.useState<Errors>({});
  const [announcement, setAnnouncement] = React.useState("");
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  // Where focus goes after the next commit: the new step's heading, or the first invalid field.
  const focusNext = React.useRef<"heading" | "invalid" | null>(null);
  const last = ONBOARDING_STEPS.length - 1;

  React.useEffect(() => {
    if (focusNext.current === "heading") headingRef.current?.focus();
    if (focusNext.current === "invalid") {
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
    }
    focusNext.current = null;
  });

  const update = <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const go = (target: number) => {
    focusNext.current = "heading";
    setErrors({});
    setStep(target);
    setAnnouncement(onboardingStepLabel(target));
  };

  // Next, Finish and a forward step in the stepper: the current step must be valid first.
  const advance = (target: number) => {
    if (step < last) {
      const found = validateOnboardingStep(step, answers);
      if (Object.keys(found).length > 0) {
        focusNext.current = "invalid";
        setErrors(found);
        return;
      }
      if (step === last - 1) onComplete?.(answers);
    }
    setReached((current) => Math.max(current, step + 1));
    go(target);
  };

  const headingId = `${id}-heading`;
  const field = (name: string) => `${id}-${name}`;

  return (
    <Card className="mx-auto w-full max-w-160">
      <CardHeader>
        <h1 className="font-display text-2xl">Welcome aboard</h1>
        <p className="text-sm text-muted-foreground">Three questions, and your library is ready.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Stepper
          aria-label="Setup"
          value={step}
          onValueChange={(target) => (target > step ? advance(target) : go(target))}
        >
          {ONBOARDING_STEPS.map((title, index) => (
            <StepperItem key={title} step={index} completed={index < reached && index !== step}>
              <StepperTrigger>
                <StepperIndicator />
                <StepperTitle>{title}</StepperTitle>
              </StepperTrigger>
              {index < last ? <StepperSeparator /> : null}
            </StepperItem>
          ))}
        </Stepper>
        <p role="status" className="sr-only">
          {announcement}
        </p>
        <form
          ref={formRef}
          aria-labelledby={headingId}
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            advance(step + 1);
          }}
        >
          <h2
            ref={headingRef}
            id={headingId}
            tabIndex={-1}
            className="rounded-sm font-display text-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {ONBOARDING_STEPS[step]}
          </h2>

          {step === 0 ? (
            <FieldGroup>
              <Field data-invalid={errors.name ? true : undefined}>
                <FieldLabel htmlFor={field("name")}>
                  Name <span className="font-normal text-muted-foreground">(required)</span>
                </FieldLabel>
                <Input
                  id={field("name")}
                  name="name"
                  autoComplete="name"
                  required
                  value={answers.name}
                  onChange={(event) => update("name", event.target.value)}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? field("name-error") : undefined}
                />
                {errors.name ? (
                  <FieldError id={field("name-error")}>{errors.name}</FieldError>
                ) : null}
              </Field>
              <FieldSet>
                <FieldLegend variant="label" id={field("device-legend")}>
                  I mostly read
                </FieldLegend>
                <RadioGroup
                  name="device"
                  aria-labelledby={field("device-legend")}
                  value={answers.device}
                  onValueChange={(value) => update("device", value as OnboardingDevice)}
                >
                  {onboardingDevices.map((device) => (
                    <Field key={device.value} orientation="horizontal">
                      <RadioGroupItem value={device.value} id={field(`device-${device.value}`)} />
                      <FieldLabel htmlFor={field(`device-${device.value}`)} className="font-normal">
                        {device.label}
                      </FieldLabel>
                    </Field>
                  ))}
                </RadioGroup>
              </FieldSet>
            </FieldGroup>
          ) : null}

          {step === 1 ? (
            <FieldSet data-invalid={errors.genres ? true : undefined}>
              <FieldLegend variant="label">
                Genres{" "}
                <span className="font-normal text-muted-foreground">
                  (at least {ONBOARDING_MIN_GENRES})
                </span>
              </FieldLegend>
              <FieldDescription id={field("genres-hint")}>
                {`${answers.genres.length} picked. We use them to fill your first shelves.`}
              </FieldDescription>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {onboardingGenres.map((genre, index) => (
                  <Field key={genre} orientation="horizontal">
                    <Checkbox
                      id={field(`genre-${index}`)}
                      name="genres"
                      value={genre}
                      checked={answers.genres.includes(genre)}
                      onCheckedChange={(checked) =>
                        update(
                          "genres",
                          checked
                            ? [...answers.genres, genre]
                            : answers.genres.filter((picked) => picked !== genre),
                        )
                      }
                      aria-invalid={errors.genres ? true : undefined}
                      aria-describedby={
                        errors.genres
                          ? `${field("genres-hint")} ${field("genres-error")}`
                          : field("genres-hint")
                      }
                    />
                    <FieldLabel htmlFor={field(`genre-${index}`)} className="font-normal">
                      {genre}
                    </FieldLabel>
                  </Field>
                ))}
              </div>
              {errors.genres ? (
                <FieldError id={field("genres-error")}>{errors.genres}</FieldError>
              ) : null}
            </FieldSet>
          ) : null}

          {step === 2 ? (
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor={field("reminder")}>Daily reminder</FieldLabel>
                  <FieldDescription>A nudge to read, once a day.</FieldDescription>
                </FieldContent>
                <Switch
                  id={field("reminder")}
                  name="reminder"
                  checked={answers.reminder}
                  onCheckedChange={(checked) => update("reminder", checked)}
                />
              </Field>
              <Field data-invalid={errors.reminderTime ? true : undefined}>
                <FieldLabel id={field("time-label")} htmlFor={field("time")}>
                  Reminder time
                </FieldLabel>
                {/* A vertical field stretches its controls; the wrapper keeps the picker's width. */}
                <div>
                  <TimePicker
                    id={field("time")}
                    aria-labelledby={field("time-label")}
                    aria-invalid={errors.reminderTime ? true : undefined}
                    aria-describedby={errors.reminderTime ? field("time-error") : undefined}
                    hourCycle={24}
                    name="reminderTime"
                    disabled={!answers.reminder}
                    value={answers.reminderTime}
                    onValueChange={(value) => update("reminderTime", value)}
                  />
                </div>
                {errors.reminderTime ? (
                  <FieldError id={field("time-error")}>{errors.reminderTime}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldTitle id={field("direction-label")}>Reading direction</FieldTitle>
                <ToggleGroup
                  aria-labelledby={field("direction-label")}
                  variant="outline"
                  spacing={0}
                  className="flex-wrap"
                  value={[answers.direction]}
                  onValueChange={(value: string[]) => {
                    if (value[0]) update("direction", value[0] as OnboardingDirection);
                  }}
                >
                  {onboardingDirections.map((direction) => (
                    <ToggleGroupItem key={direction.value} value={direction.value}>
                      {direction.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <input type="hidden" name="direction" value={answers.direction} />
              </Field>
            </FieldGroup>
          ) : null}

          {step === last ? <OnboardingSummary answers={answers} /> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => go(step - 1)}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < last ? (
              <Button type="submit">{step === last - 1 ? "Finish" : "Next"}</Button>
            ) : (
              <Button nativeButton={false} role="link" render={<Link href={libraryHref} />}>
                Go to library
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/** The Done step: every answer, in the order asked. */
function OnboardingSummary({ answers }: { answers: OnboardingAnswers }) {
  const device = onboardingDevices.find((option) => option.value === answers.device)?.label;
  const direction = onboardingDirections.find(
    (option) => option.value === answers.direction,
  )?.label;
  const rows: [string, string][] = [
    ["Name", answers.name.trim()],
    ["Mostly reads", device ?? ""],
    ["Genres", answers.genres.join(", ")],
    ["Daily reminder", answers.reminder ? `On, at ${answers.reminderTime}` : "Off"],
    ["Reading direction", direction ?? ""],
  ];
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
      {rows.map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="text-muted-foreground">{term}</dt>
          <dd className="min-w-0 font-medium break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
