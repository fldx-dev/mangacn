import { BookOpenIcon, InfoIcon, MessageSquareIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/ui/tabs/tabs";

const chapters = [
  { number: 14, title: "Last train home", date: "Nov 18" },
  { number: 13, title: "Two umbrellas", date: "Nov 11" },
  { number: 12, title: "The rooftop showdown", date: "Nov 4" },
];

const reviews = [
  { name: "inkfan", text: "The chase in chapter 12 reads like a film." },
  { name: "tonebrush", text: "Gorgeous screentone work on every rainy page." },
];

export default function TabsSeriesPageVariant() {
  return (
    <Tabs defaultValue="chapters" className="w-full max-w-sm">
      <TabsList className="w-full">
        <TabsTrigger value="chapters">
          <BookOpenIcon data-icon="inline-start" aria-hidden="true" />
          Chapters
        </TabsTrigger>
        <TabsTrigger value="about">
          <InfoIcon data-icon="inline-start" aria-hidden="true" />
          About
        </TabsTrigger>
        <TabsTrigger value="reviews">
          <MessageSquareIcon data-icon="inline-start" aria-hidden="true" />
          Reviews
        </TabsTrigger>
      </TabsList>
      <TabsContent value="chapters" className="pt-2">
        <ol className="grid gap-2">
          {chapters.map((chapter) => (
            <li key={chapter.number} className="flex items-baseline justify-between gap-3">
              <span>
                <span className="text-muted-foreground tabular-nums">Ch. {chapter.number}</span>{" "}
                {chapter.title}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{chapter.date}</span>
            </li>
          ))}
        </ol>
      </TabsContent>
      <TabsContent value="about" className="pt-2">
        <p>
          A courier races the rain across the rooftops of a city that never sleeps. Weekly, by
          Mizuki Ren.
        </p>
      </TabsContent>
      <TabsContent value="reviews" className="pt-2">
        <ul className="grid gap-2">
          {reviews.map((review) => (
            <li key={review.name}>
              <span className="font-medium">{review.name}</span>{" "}
              <span className="text-muted-foreground">{review.text}</span>
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  );
}
