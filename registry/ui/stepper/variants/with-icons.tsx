import { CalendarIcon, ImageIcon, PrinterIcon, TypeIcon, UploadIcon } from "lucide-react";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/registry/ui/stepper/stepper";

// Publishing a chapter: an icon for each step, any open step can be chosen, and the print run
// stays shut until the chapter is collected in a volume.
const steps = [
  { title: "Pages", description: "20 uploaded", icon: UploadIcon },
  { title: "Lettering", description: "Balloons and SFX", icon: TypeIcon },
  { title: "Cover", description: "Colour page", icon: ImageIcon },
  { title: "Schedule", description: "Friday, 00:00", icon: CalendarIcon },
  { title: "Print run", description: "With volume 12", icon: PrinterIcon, disabled: true },
];

export default function StepperWithIconsVariant() {
  return (
    <Stepper aria-label="Publish chapter 13" defaultValue={2} linear={false} className="max-w-3xl">
      {steps.map((step, index) => (
        <StepperItem key={step.title} step={index} disabled={step.disabled}>
          <StepperTrigger>
            <StepperIndicator>
              <step.icon />
            </StepperIndicator>
            <StepperTitle>{step.title}</StepperTitle>
            <StepperDescription>{step.description}</StepperDescription>
          </StepperTrigger>
          {index < steps.length - 1 ? <StepperSeparator /> : null}
        </StepperItem>
      ))}
    </Stepper>
  );
}
