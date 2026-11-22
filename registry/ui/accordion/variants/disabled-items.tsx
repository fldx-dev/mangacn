import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/registry/ui/accordion/accordion";

const volumes = [
  { value: "vol-1", title: "Volume 1", chapters: "Chapters 1–8: the move to the city." },
  { value: "vol-2", title: "Volume 2", chapters: "Chapters 9–16: the rooftop races." },
  { value: "vol-3", title: "Volume 3 · out in May", chapters: "Chapters 17–24.", disabled: true },
  {
    value: "vol-4",
    title: "Volume 4 · out in August",
    chapters: "Chapters 25–32.",
    disabled: true,
  },
];

export default function AccordionDisabledItemsVariant() {
  return (
    <Accordion defaultValue={["vol-2"]} className="max-w-sm">
      {volumes.map((volume) => (
        <AccordionItem key={volume.value} value={volume.value} disabled={volume.disabled}>
          {/* Base UI disables the trigger natively, so grey it out by its data-disabled. */}
          <AccordionTrigger className="data-disabled:text-muted-foreground data-disabled:no-underline">
            {volume.title}
          </AccordionTrigger>
          <AccordionContent>{volume.chapters}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
