import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/registry/ui/stepper/stepper";

const steps = [
  { title: "Cart", description: "3 volumes" },
  { title: "Shipping", description: "Kyoto, next day" },
  { title: "Payment", description: "Card declined", error: true },
  { title: "Review", description: "Check and order" },
];

export default function StepperDefaultDemo() {
  return (
    <Stepper aria-label="Checkout" defaultValue={2} className="max-w-2xl">
      {steps.map((step, index) => (
        <StepperItem key={step.title} step={index} error={step.error}>
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>{step.title}</StepperTitle>
            <StepperDescription>{step.description}</StepperDescription>
          </StepperTrigger>
          {index < steps.length - 1 ? <StepperSeparator /> : null}
        </StepperItem>
      ))}
    </Stepper>
  );
}
