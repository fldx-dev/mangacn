"use client";

import { Questionnaire as QuestionnairePrimitive } from "@shadcn/react/questionnaire";
import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Button, buttonVariants } from "@/components/ui/button";

// Based on shadcn/ui Questionnaire (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Restyled for mangacn: the behaviour and keyboard are stock's (@shadcn/react). Choices are
// outlined paper rows; the chosen one is ink with paper text, as dropdown-menu highlights its
// rows. The progress is drawn as progress's inked track under its text, the error is spot, the
// field is an outlined input, and Previous, Skip, Next and Submit render mangacn's button.

function Questionnaire({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Root>) {
  return (
    <QuestionnairePrimitive.Root
      data-slot="questionnaire"
      className={cn("flex w-full min-w-0 flex-col gap-4", className)}
      {...props}
    />
  );
}

function QuestionnaireProgress({
  className,
  render,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Progress>) {
  return (
    <QuestionnairePrimitive.Progress
      data-slot="questionnaire-progress"
      className={cn(
        "flex min-h-[1lh] w-full max-w-48 min-w-[14ch] flex-col gap-1.5 text-xs font-medium text-muted-foreground tabular-nums",
        className,
      )}
      render={
        render ??
        ((props, { current, total }) => {
          const { children, ...host } = props as React.ComponentProps<"div">;
          return (
            <div {...host}>
              {children}
              {/* progress's track: an inked outline with a solid ink indicator. */}
              <span
                aria-hidden="true"
                className="relative isolate flex h-2.5 w-full items-center rounded-full bg-muted has-[>[data-inked=true]]:bg-transparent!"
              >
                <InkFrame
                  as="span"
                  fill="paper"
                  className="pointer-events-none absolute inset-0 -z-1 rounded-full"
                />
                <span
                  className="h-full rounded-full bg-primary transition-all motion-reduce:transition-none"
                  style={{ width: `${total ? (current / total) * 100 : 0}%` }}
                />
              </span>
            </div>
          );
        })
      }
      {...props}
    />
  );
}

function QuestionnaireItem({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Item>) {
  return (
    <QuestionnairePrimitive.Item
      data-slot="questionnaire-item"
      className={cn("flex min-w-0 flex-col gap-4 border-0 p-0 outline-none", className)}
      {...props}
    />
  );
}

function QuestionnaireTitle({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return (
    <QuestionnairePrimitive.Title
      data-slot="questionnaire-title"
      className={cn(
        "cn-font-heading text-base leading-snug font-medium text-pretty [&:not(:has(~[data-slot=questionnaire-description]))]:mb-4",
        className,
      )}
      {...props}
    />
  );
}

function QuestionnaireDescription({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Description>) {
  return (
    <QuestionnairePrimitive.Description
      data-slot="questionnaire-description"
      className={cn("text-sm text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

function QuestionnaireChoices({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  return (
    <QuestionnairePrimitive.Choices
      data-slot="questionnaire-choices"
      className={cn("group/questionnaire-choices grid min-w-0 gap-2", className)}
      {...props}
    />
  );
}

function QuestionnaireChoice({
  children,
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choice>) {
  return (
    <QuestionnairePrimitive.Choice
      data-slot="questionnaire-choice"
      className={cn(
        "group/questionnaire-choice relative isolate flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border-0 bg-transparent px-3 py-2.5 text-start text-sm transition-colors outline-none select-none hover:[--paper:var(--muted)] has-[>input:focus-visible]:ring-3 has-[>input:focus-visible]:ring-ring/50 data-invalid:[--ink:var(--destructive)] data-checked:bg-primary data-checked:text-primary-foreground has-[>[data-inked=true]]:bg-transparent!",
        "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:text-muted-foreground data-disabled:halftone-light",
        className,
      )}
      {...props}
    >
      {/* The row: paper, or ink once chosen (one frame each, shown by state). */}
      <InkFrame
        as="span"
        fill="paper"
        className="pointer-events-none absolute inset-0 -z-1 group-data-checked/questionnaire-choice:hidden group-data-disabled/questionnaire-choice:hidden"
      />
      <InkFrame
        as="span"
        fill="ink"
        className="pointer-events-none absolute inset-0 -z-1 hidden group-data-checked/questionnaire-choice:block"
      />
      <InkFrame
        as="span"
        fill="none"
        className="pointer-events-none absolute inset-0 -z-1 hidden group-data-disabled/questionnaire-choice:block"
      />
      <QuestionnairePrimitive.ChoiceInput
        data-slot="questionnaire-choice-input"
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        data-slot="questionnaire-choice-indicator"
        className="pointer-events-none relative isolate flex size-4 shrink-0 translate-y-[--spacing(0.45)] items-center justify-center rounded-[4px] group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[type=radio]/questionnaire-choice:rounded-full group-data-checked/questionnaire-choice:text-primary"
      >
        {/* A paper box (a circle for single choice) that stays paper on the ink row. */}
        <InkFrame
          as="span"
          fill="paper"
          className="pointer-events-none absolute inset-0 -z-1 group-data-checked/questionnaire-choice:[--ink:var(--paper)] group-data-[type=radio]/questionnaire-choice:hidden"
        />
        <InkFrame
          as="span"
          shape="ellipse"
          fill="paper"
          className="pointer-events-none absolute inset-0 -z-1 hidden group-data-checked/questionnaire-choice:[--ink:var(--paper)] group-data-[type=radio]/questionnaire-choice:block"
        />
        <span
          data-slot="questionnaire-choice-indicator-dot"
          className="hidden size-2 rounded-full bg-primary group-data-[type=checkbox]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
        />
        <CheckIcon
          data-slot="questionnaire-choice-indicator-check"
          className="hidden size-3.5 group-data-[type=radio]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
        />
      </span>
      <QuestionnairePrimitive.ChoiceLabel
        data-slot="questionnaire-choice-label"
        className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug"
      >
        {children}
      </QuestionnairePrimitive.ChoiceLabel>
      <QuestionnairePrimitive.ChoiceShortcut
        data-slot="questionnaire-choice-shortcut"
        className="pointer-events-none relative isolate ms-auto hidden size-5 shrink-0 translate-y-[--spacing(0.45)] items-center justify-center rounded-md font-mono text-[0.625rem] leading-none font-medium text-muted-foreground group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[shortcut]/questionnaire-choice:inline-flex after:content-[attr(data-shortcut)]"
      >
        <InkFrame
          as="span"
          fill="paper"
          className="pointer-events-none absolute inset-0 -z-1 group-data-checked/questionnaire-choice:[--ink:var(--paper)]"
        />
      </QuestionnairePrimitive.ChoiceShortcut>
    </QuestionnairePrimitive.Choice>
  );
}

function QuestionnaireChoiceDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="questionnaire-choice-description"
      className={cn(
        "text-muted-foreground group-data-checked/questionnaire-choice:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

function QuestionnaireInput({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Input>) {
  return (
    <div
      data-slot="questionnaire-input-wrapper"
      className="group/questionnaire-input relative isolate w-full min-w-0 rounded-lg has-aria-invalid:[--ink:var(--destructive)] has-disabled:halftone-light"
    >
      <InkFrame
        as="span"
        fill="paper"
        className="pointer-events-none absolute inset-0 -z-1 rounded-lg group-has-disabled/questionnaire-input:hidden"
      />
      <QuestionnairePrimitive.Input
        data-slot="questionnaire-input"
        className={cn(
          "h-8 min-h-11 w-full min-w-0 rounded-lg border-0 bg-transparent px-2.5 py-1 text-base transition-[color,box-shadow,background-color] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-muted-foreground aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:min-h-0 md:text-sm dark:aria-invalid:ring-destructive/40",
          "selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function QuestionnaireError({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Error>) {
  return (
    <QuestionnairePrimitive.Error
      data-slot="questionnaire-error"
      className={cn("mt-2 text-sm font-medium text-destructive", className)}
      {...props}
    />
  );
}

function QuestionnaireActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn(
        "grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:min-h-8",
        className,
      )}
      {...props}
    />
  );
}

function QuestionnairePrevious({
  children,
  className,
  render,
  size = "default",
  variant = "outline",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Previous> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Previous
      data-slot="questionnaire-previous"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-1 row-start-1 min-h-11 justify-self-start sm:min-h-0",
        className,
      )}
      render={render ?? <Button size={size} variant={variant} />}
      {...props}
    >
      {children ?? "Previous"}
    </QuestionnairePrimitive.Previous>
  );
}

function QuestionnaireSkip({
  children,
  className,
  render,
  size = "default",
  variant = "outline",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Skip> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Skip
      data-slot="questionnaire-skip"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-2 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className,
      )}
      render={render ?? <Button size={size} variant={variant} />}
      {...props}
    >
      {children ?? "Skip"}
    </QuestionnairePrimitive.Skip>
  );
}

function QuestionnaireNext({
  children,
  className,
  render,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Next> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Next
      data-slot="questionnaire-next"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className,
      )}
      render={render ?? <Button size={size} variant={variant} />}
      {...props}
    >
      {children ?? "Next"}
    </QuestionnairePrimitive.Next>
  );
}

function QuestionnaireSubmit({
  children,
  className,
  render,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Submit
      data-slot="questionnaire-submit"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className,
      )}
      render={render ?? <Button size={size} variant={variant} />}
      {...props}
    >
      {children ?? "Submit"}
    </QuestionnairePrimitive.Submit>
  );
}

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
};
