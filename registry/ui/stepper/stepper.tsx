"use client";

import { cn } from "cn";
import { CheckIcon, XIcon } from "lucide-react";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";

// mangacn's stepper (SPEC-components-7 §4.9): the numbered steps of a process in an ordered
// list. Not a tablist: a step that can be chosen is a button in the Tab order, one that cannot is
// text. Each indicator is a hand-drawn circle and each separator a drawn line. Children with a
// numeric `step` prop (StepperItem, StepperContent) are rendered in the <ol>, where only items
// show; all children are rendered again after it, where only a top-level StepperContent (a
// horizontal stepper's) and anything else (Back / Next) show. Props, not component types, decide:
// a server component's children reach the stepper as client references.

type StepperOrientation = "horizontal" | "vertical";
type StepState = "completed" | "active" | "inactive";

/** The words the stepper says to screen readers; each trigger's name is built from them. */
export interface StepperLabels {
  /**
   * Read before each step's title.
   * @default (n, total) => `Step ${n} of ${total}`
   */
  step?: (n: number, total: number) => string;
  /**
   * Ends a completed step's name.
   * @default "completed"
   */
  completed?: string;
  /**
   * Ends the name of a step with an error.
   * @default "error"
   */
  error?: string;
}

const DEFAULT_LABELS: Required<StepperLabels> = {
  step: (n, total) => `Step ${n} of ${total}`,
  completed: "completed",
  error: "error",
};

export interface StepperProps
  extends Omit<React.ComponentProps<"ol">, "defaultValue" | "onChange"> {
  /** The current step (0-based). Controlled. */
  value?: number;
  /**
   * The starting step when uncontrolled.
   * @default 0
   */
  defaultValue?: number;
  /** Called with the step a trigger chose. */
  onValueChange?: (step: number) => void;
  /**
   * Horizontal shows only the indicators and the current title under 768 px; vertical is the
   * same at every width and puts each StepperContent under its item.
   * @default "horizontal"
   */
  orientation?: StepperOrientation;
  /**
   * Only completed steps and the one after the current step can be chosen.
   * @default true
   */
  linear?: boolean;
  /** Overrides the screen-reader words. */
  labels?: StepperLabels;
}

interface StepperContextValue {
  value: number;
  setValue: (step: number) => void;
  orientation: StepperOrientation;
  linear: boolean;
  total: number;
  labels: Required<StepperLabels>;
}

const StepperContext = React.createContext<StepperContextValue | null>(null);
/** True inside the <ol>: items render there, a top-level StepperContent after it. */
const StepperListContext = React.createContext(false);

function useStepper(part: string) {
  const context = React.useContext(StepperContext);
  if (!context) throw new Error(`${part} must be used inside <Stepper>`);
  return context;
}

interface StepperItemContextValue {
  step: number;
  state: StepState;
  choosable: boolean;
  error: boolean;
}

const StepperItemContext = React.createContext<StepperItemContextValue | null>(null);

function useStepperItem(part: string) {
  const context = React.useContext(StepperItemContext);
  if (!context) throw new Error(`${part} must be used inside <StepperItem>`);
  return context;
}

export function Stepper({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  orientation = "horizontal",
  linear = true,
  labels: labelsProp,
  className,
  children,
  ...props
}: StepperProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const value = valueProp ?? uncontrolled;
  const setValue = (step: number) => {
    if (step === value) return;
    if (valueProp === undefined) setUncontrolled(step);
    onValueChange?.(step);
  };

  const stepped = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<{ step: number }> =>
      React.isValidElement<{ step?: unknown }>(child) && typeof child.props.step === "number",
  );

  const context: StepperContextValue = {
    value,
    setValue,
    orientation,
    linear,
    total: stepped.reduce((total, child) => Math.max(total, child.props.step + 1), 0),
    labels: { ...DEFAULT_LABELS, ...labelsProp },
  };

  return (
    <StepperContext.Provider value={context}>
      <ol
        data-slot="stepper"
        data-orientation={orientation}
        className={cn(
          "group/stepper flex min-w-0",
          orientation === "horizontal" ? "w-full items-start gap-2" : "flex-col",
          className,
        )}
        {...props}
      >
        <StepperListContext.Provider value={true}>{stepped}</StepperListContext.Provider>
      </ol>
      {children}
    </StepperContext.Provider>
  );
}

export interface StepperItemProps extends React.ComponentProps<"li"> {
  /** The step's index, 0-based. */
  step: number;
  /** Marks the step completed; without it, steps before the current one count as completed. */
  completed?: boolean;
  /**
   * Makes the step text that cannot be chosen.
   * @default false
   */
  disabled?: boolean;
  /**
   * Draws the indicator in spot with an icon and ends the step's name with "error".
   * @default false
   */
  error?: boolean;
}

export function StepperItem({
  step,
  completed,
  disabled = false,
  error = false,
  className,
  ...props
}: StepperItemProps) {
  const { value, linear, orientation } = useStepper("StepperItem");
  const inList = React.useContext(StepperListContext);
  if (!inList) return null;
  const state: StepState =
    step === value ? "active" : (completed ?? step < value) ? "completed" : "inactive";
  const choosable = !disabled && (!linear || state !== "inactive" || step === value + 1);

  return (
    <StepperItemContext.Provider value={{ step, state, choosable, error }}>
      <li
        data-slot="stepper-item"
        data-state={state}
        data-orientation={orientation}
        data-disabled={disabled ? "" : undefined}
        data-invalid={error ? "" : undefined}
        aria-current={state === "active" ? "step" : undefined}
        className={cn(
          "group/stepper-item min-w-0",
          orientation === "horizontal"
            ? // Under 768 the current step takes a larger share, for the one title shown.
              "flex flex-1 items-center gap-2 last:flex-none max-md:data-[state=active]:not-last:flex-[3]"
            : "grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3",
          className,
        )}
        {...props}
      />
    </StepperItemContext.Provider>
  );
}

export type StepperTriggerProps = React.ComponentProps<"button">;

/** A button when the step can be chosen, else plain text; its name ends with the step's state. */
export function StepperTrigger({ className, children, onClick, ...props }: StepperTriggerProps) {
  const { setValue, total, labels, orientation } = useStepper("StepperTrigger");
  const { step, state, choosable, error } = useStepperItem("StepperTrigger");
  const status = error ? labels.error : state === "completed" ? labels.completed : null;
  const classes = cn(
    "grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-2 rounded-md text-left outline-none",
    "focus-visible:ring-[3px] focus-visible:ring-ring/50",
    orientation === "vertical" && "col-span-2 gap-x-3",
    choosable && "cursor-pointer",
    className,
  );
  const content = (
    <>
      <span className="sr-only">{labels.step(step + 1, total)}: </span>
      {children}
      {status ? <span className="sr-only">, {status}</span> : null}
    </>
  );

  if (!choosable) {
    return (
      <span data-slot="stepper-trigger" className={classes}>
        {content}
      </span>
    );
  }
  return (
    <button
      type="button"
      data-slot="stepper-trigger"
      className={classes}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setValue(step);
      }}
      {...props}
    >
      {content}
    </button>
  );
}

export type StepperIndicatorProps = React.ComponentProps<"span">;

/** A hand-drawn circle: the number on paper, ink-filled when current, a check when completed. */
export function StepperIndicator({ className, children, ...props }: StepperIndicatorProps) {
  const { step, state, error } = useStepperItem("StepperIndicator");
  const fill = state === "active" && !error ? "ink" : "paper";
  return (
    <span
      data-slot="stepper-indicator"
      data-state={state}
      aria-hidden="true"
      className={cn(
        "relative isolate row-span-2 grid size-8 shrink-0 place-items-center self-center text-sm font-semibold tabular-nums [&_svg:not([class*='size-'])]:size-4",
        state === "active" && !error && "text-primary-foreground",
        error && "text-spot [--ink:var(--spot)]",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        shape="ellipse"
        fill={fill}
        className="pointer-events-none absolute inset-0 -z-1 rounded-full"
      />
      {children ?? (error ? <XIcon /> : state === "completed" ? <CheckIcon /> : String(step + 1))}
    </span>
  );
}

export type StepperTitleProps = React.ComponentProps<"span">;

export function StepperTitle({ className, ...props }: StepperTitleProps) {
  return (
    <span
      data-slot="stepper-title"
      className={cn(
        "col-start-2 min-w-0 truncate text-sm font-medium",
        // Horizontal under 768: only the current step's title shows; the rest stay for readers.
        "max-md:group-data-[orientation=horizontal]/stepper:group-data-[state=completed]/stepper-item:sr-only max-md:group-data-[orientation=horizontal]/stepper:group-data-[state=inactive]/stepper-item:sr-only",
        "group-data-[state=inactive]/stepper-item:text-muted-foreground group-data-[invalid]/stepper-item:text-spot",
        className,
      )}
      {...props}
    />
  );
}

export type StepperDescriptionProps = React.ComponentProps<"span">;

export function StepperDescription({ className, ...props }: StepperDescriptionProps) {
  return (
    <span
      data-slot="stepper-description"
      className={cn(
        "col-start-2 min-w-0 text-xs text-muted-foreground",
        "max-md:group-data-[orientation=horizontal]/stepper:sr-only",
        className,
      )}
      {...props}
    />
  );
}

export type StepperSeparatorProps = React.ComponentProps<"span">;

/** A drawn line to the next step: across in a horizontal stepper, down in a vertical one. */
export function StepperSeparator({ className, ...props }: StepperSeparatorProps) {
  const { orientation } = useStepper("StepperSeparator");
  return (
    <span
      data-slot="stepper-separator"
      aria-hidden="true"
      className={cn(
        "flex",
        orientation === "horizontal"
          ? "h-8 min-w-4 flex-1 items-center"
          : "col-start-1 row-start-2 min-h-6 justify-center self-stretch py-1",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        className={cn(
          "block",
          orientation === "horizontal" ? "h-(--outline-width) w-full" : "w-(--outline-width)",
        )}
      />
    </span>
  );
}

export interface StepperContentProps extends React.ComponentProps<"div"> {
  /** The step this content belongs to; it shows while that step is the value. */
  step: number;
}

export function StepperContent({ step, className, ...props }: StepperContentProps) {
  const { value, orientation } = useStepper("StepperContent");
  const inList = React.useContext(StepperListContext);
  const inItem = React.useContext(StepperItemContext) !== null;
  // Under its item (vertical), or after the list (top level); never loose inside the <ol>.
  if (step !== value || (inList && !inItem)) return null;
  return (
    <div
      data-slot="stepper-content"
      data-orientation={orientation}
      className={cn(
        "min-w-0 text-sm",
        orientation === "vertical" && "col-start-2 row-start-2 pt-2 pb-6",
        className,
      )}
      {...props}
    />
  );
}
