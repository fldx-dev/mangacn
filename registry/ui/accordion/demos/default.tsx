import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/registry/ui/accordion/accordion";

const faqs = [
  {
    value: "direction",
    question: "Which way do I read?",
    answer: "Right to left: start at the top-right panel and work down the page.",
  },
  {
    value: "tones",
    question: "What are screentones?",
    answer: "Printed dot and line patterns that shade the art without colour.",
  },
  {
    value: "sfx",
    question: "Why are sound effects so big?",
    answer: "SFX are part of the drawing, lettered by hand to match the action.",
  },
];

export default function AccordionDefaultDemo() {
  return (
    <Accordion defaultValue={["direction"]} className="max-w-sm">
      {faqs.map((faq) => (
        <AccordionItem key={faq.value} value={faq.value}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
