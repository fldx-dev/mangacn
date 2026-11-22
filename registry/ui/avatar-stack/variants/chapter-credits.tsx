import { AvatarStack } from "@/registry/ui/avatar-stack/avatar-stack";

// A chapter list where each row credits the people who made the chapter.
const chapters = [
  {
    number: 12,
    title: "The Rooftop Chase",
    team: ["Aiko Mori", "Kenji Arata", "Sora Hayashi"],
  },
  {
    number: 13,
    title: "Night Station",
    team: ["Aiko Mori", "Yuki Tanabe", "Haru Ogawa", "Mei Kato", "Ren Fujita", "Nao Ishida"],
  },
  {
    number: 14,
    title: "Dojo Flashback",
    team: ["Aiko Mori", "Kenji Arata"],
  },
];

export default function AvatarStackChapterCreditsVariant() {
  return (
    <ul className="flex w-full max-w-md flex-col divide-y divide-border">
      {chapters.map((chapter) => (
        <li key={chapter.number} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Chapter {chapter.number}</p>
            <p className="truncate text-sm font-medium">{chapter.title}</p>
          </div>
          <AvatarStack
            items={chapter.team.map((name) => ({ name }))}
            max={3}
            size="sm"
            aria-label={`Credits for chapter ${chapter.number}`}
            className="shrink-0"
          />
        </li>
      ))}
    </ul>
  );
}
