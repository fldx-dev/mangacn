import Link from "next/link";
import { FAQ } from "@/lib/docs/faq";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/registry/ui/accordion/accordion";

/**
 * The FAQ, before the footer: the questions people ask before installing, in mangacn's own
 * accordion. Closed panels stay mounted (`keepMounted`, `hidden="until-found"`), so every answer
 * is in the prerendered HTML for search engines and AI crawlers, and the browser's find-in-page
 * opens the panel it matches. The landing's FAQPage JSON-LD reads the same list (lib/docs/faq.ts).
 */
export function Faq() {
  return (
    <section id="faq" data-landing="faq" aria-labelledby="landing-faq" className="border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        <div className="flex flex-col gap-4">
          <h2 id="landing-faq" className="font-display text-3xl text-balance sm:text-4xl">
            Questions, answered.
          </h2>
          <p className="max-w-sm text-base text-muted-foreground">
            What people ask before the first install. The rest is in the{" "}
            <Link
              href="/docs"
              className="font-semibold text-foreground underline underline-offset-4 hover:decoration-2"
            >
              docs
            </Link>
            .
          </p>
        </div>
        <Accordion className="min-w-0">
          {FAQ.map(({ question, answer, more }) => (
            <AccordionItem key={question} value={question}>
              <AccordionTrigger className="gap-4 py-4 text-base sm:text-lg">
                {question}
              </AccordionTrigger>
              <AccordionContent keepMounted hiddenUntilFound className="pb-5 text-base">
                <p className="text-pretty">{answer}</p>
                {more ? (
                  <p>
                    <Link href={more.href} className="font-semibold">
                      {more.label} →
                    </Link>
                  </p>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
