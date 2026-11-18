"use client";

import * as React from "react";
import { Button } from "@/registry/ui/button/button";
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/registry/ui/stepper/stepper";

const steps = [
  {
    title: "Series details",
    description: "Title, genre and a logline",
    body: "Name the series and say in one line what it is about.",
  },
  {
    title: "Pages",
    description: "The first chapter",
    body: "Upload the first chapter, 20 to 60 pages, inked.",
  },
  {
    title: "Character sheets",
    description: "Up to three",
    body: "Add a sheet for each lead: a front view and a few expressions.",
  },
  {
    title: "Submit",
    description: "To the editors",
    body: "The editors answer within four weeks.",
  },
];

export default function StepperVerticalDemo() {
  const [step, setStep] = React.useState(1);
  const last = steps.length - 1;
  return (
    <Stepper
      aria-label="Submit a series"
      orientation="vertical"
      value={step}
      onValueChange={setStep}
      className="w-full max-w-md"
    >
      {steps.map((item, index) => (
        <StepperItem key={item.title} step={index}>
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>{item.title}</StepperTitle>
            <StepperDescription>{item.description}</StepperDescription>
          </StepperTrigger>
          {index < last ? <StepperSeparator /> : null}
          <StepperContent step={index} className="flex flex-col gap-3">
            <p className="text-muted-foreground">{item.body}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={index === 0}
                onClick={() => setStep(index - 1)}
              >
                Back
              </Button>
              <Button size="sm" onClick={() => setStep(Math.min(index + 1, last))}>
                {index === last ? "Submit" : "Next"}
              </Button>
            </div>
          </StepperContent>
        </StepperItem>
      ))}
    </Stepper>
  );
}
