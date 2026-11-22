import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/registry/ui/accordion/accordion";

const notes = [
  {
    value: "ch-10",
    chapter: "Chapter 10 · Last Train",
    note: "Tighten the station spread: the clock panel should land on the page turn.",
  },
  {
    value: "ch-11",
    chapter: "Chapter 11 · Paper Moon",
    note: "Letter the rain SFX smaller so the dialogue on page 6 can breathe.",
  },
  {
    value: "ch-12",
    chapter: "Chapter 12 · Rooftop",
    note: "Pencils approved. Inks due Friday, tones the Monday after.",
  },
];

export default function AccordionSeveralOpenVariant() {
  return (
    <Accordion multiple defaultValue={["ch-10", "ch-12"]} className="max-w-sm">
      {notes.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger>{item.chapter}</AccordionTrigger>
          <AccordionContent>{item.note}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
