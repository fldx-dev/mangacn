"use client";

import { CalendarIcon, CheckIcon, ImageIcon, LockIcon, TypeIcon, UploadIcon } from "lucide-react";
import * as React from "react";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/registry/ui/stepper/stepper";

// Publishing a chapter: an icon for each step, a check once it is done, any open step can be
// chosen, and the print run stays locked until the chapter is collected in a volume.
const steps = [
  { title: "Pages", description: "20 uploaded", icon: UploadIcon },
  { title: "Lettering", description: "Balloons and SFX", icon: TypeIcon },
  { title: "Cover", description: "Colour page", icon: ImageIcon },
  { title: "Schedule", description: "Friday, 00:00", icon: CalendarIcon },
  { title: "Print run", description: "Opens with volume 12", icon: LockIcon, disabled: true },
];

export default function StepperWithIconsVariant() {
  const [step, setStep] = React.useState(2);
  return (
    <Stepper
      aria-label="Publish chapter 13"
      value={step}
      onValueChange={setStep}
      linear={false}
      className="max-w-3xl"
    >
      {steps.map((item, index) => {
        // An icon child replaces the indicator's number and its check, so the check comes back here.
        const Icon = !item.disabled && index < step ? CheckIcon : item.icon;
        return (
          <StepperItem key={item.title} step={index} disabled={item.disabled}>
            <StepperTrigger>
              <StepperIndicator>
                <Icon />
              </StepperIndicator>
              <StepperTitle>{item.title}</StepperTitle>
              <StepperDescription>{item.description}</StepperDescription>
            </StepperTrigger>
            {index < steps.length - 1 ? <StepperSeparator /> : null}
          </StepperItem>
        );
      })}
    </Stepper>
  );
}
