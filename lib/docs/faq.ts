// The landing's FAQ (components/docs/landing/faq.tsx) and its FAQPage JSON-LD (app/(site)/page.tsx)
// read this one list, so the answers on the page and in the structured data never drift apart.
// Answers are plain text; `more` adds a link after the answer on the page.

export interface FaqEntry {
  question: string;
  answer: string;
  more?: { href: string; label: string };
}

export const FAQ: readonly FaqEntry[] = [
  {
    question: "Is mangacn free?",
    answer:
      "Yes. mangacn is open source under the MIT license, with no paid tier and no account. The source is on GitHub and the registry is public.",
    more: { href: "https://github.com/fldx-dev/mangacn", label: "mangacn on GitHub" },
  },
  {
    question: "Does it work with my existing shadcn/ui project?",
    answer:
      "Yes, if the project uses the base-nova style (Base UI) and Tailwind CSS v4. The restyled primitives keep shadcn's exports and props, so @mangacn/button replaces the stock button with no call-site changes. Projects on a Radix style need base-nova first.",
    more: { href: "/docs/installation", label: "Installation" },
  },
  {
    question: "Do I need Next.js?",
    answer:
      "No. Next.js is the reference setup, but any framework the shadcn CLI supports works the same way. Outside Next.js you load the three fonts yourself instead of through next/font.",
  },
  {
    question: "Does it support Tailwind CSS v3?",
    answer:
      "No. The theme ships its patterns as Tailwind v4 @utility blocks and its tokens as CSS variables, which need Tailwind CSS v4.",
  },
  {
    question: "Does it support dark mode?",
    answer:
      "Yes. Dark mode is the .dark class on <html>, as shadcn and next-themes set it. Paper turns a warm charcoal and ink an off-white; every colour pair meets WCAG AA in both modes, ink on paper AAA.",
    more: { href: "/docs/theming#dark-mode", label: "Dark mode" },
  },
  {
    question: "Is it accessible?",
    answer:
      'Each restyled primitive keeps the accessibility of the shadcn component it replaces: the same Base UI behaviour, keyboard support and ARIA. Motion is opt-in and respects prefers-reduced-motion, and Japanese text is marked lang="ja".',
  },
  {
    question: "Does it work with server-side rendering?",
    answer:
      "Yes. The ink frame is a client component that shows a plain CSS border until it draws its first outline, so server-rendered pages look right before hydration.",
  },
  {
    question: "Can I change the look?",
    answer:
      "Yes. Every value lives in your globals.css as a CSS variable: change --spot and every item follows. Three presets (Sepia, Weekly and Blueline) swap the palette, and the Create page builds a theme with your own pen, screentone and fonts.",
    more: { href: "/create", label: "Create a theme" },
  },
  {
    question: "Can an AI coding agent install it?",
    answer:
      "Yes. shadcn's MCP installs mangacn items once the registry is named in components.json, the mangacn docs MCP serves the real props and demos, and the Agent Skill teaches the design rules.",
    more: { href: "/docs/agents", label: "Set up your agent" },
  },
  {
    question: "How is mangacn different from shadcn/ui?",
    answer:
      "mangacn is built on shadcn/ui: the same CLI, files, exports, props and Base UI behaviour. It changes the drawing (hand-inked outlines, ink on paper, one spot colour) and adds manga pieces shadcn has no equivalent for, such as speech bubbles, panels, screentone and sound effects.",
    more: { href: "/docs/shadcn", label: "mangacn vs. shadcn/ui" },
  },
];

/** FAQPage JSON-LD for the landing, from the same entries the accordion shows. */
export function faqJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
