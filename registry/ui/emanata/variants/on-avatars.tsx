import { Avatar, AvatarFallback } from "@/registry/ui/avatar/avatar";
import { Emanata } from "@/registry/ui/emanata/emanata";

const cast = [
  { initials: "AK", name: "Aki", mood: "Nervous before the deadline", kind: "sweat" },
  { initials: "RN", name: "Ren", mood: "Furious about the redraw", kind: "anger" },
  { initials: "MI", name: "Mio", mood: "Delighted with the cover", kind: "sparkle" },
  { initials: "TK", name: "Taka", mood: "Shocked by the cliffhanger", kind: "surprise" },
] as const;

export default function EmanataOnAvatarsVariant() {
  return (
    // Each mark sits on a corner of the avatar, as it would beside a character's head. The mood
    // is written out, so the marks are decorative.
    <ul aria-label="Cast" className="grid w-full max-w-sm gap-4">
      {cast.map((member) => (
        <li key={member.name} className="flex items-center gap-4">
          <span className="relative shrink-0">
            <Avatar size="lg">
              <AvatarFallback>{member.initials}</AvatarFallback>
            </Avatar>
            <Emanata
              kind={member.kind}
              size="sm"
              color={member.kind === "anger" ? "spot" : "ink"}
              decorative
              className="absolute -top-2 -right-3"
            />
          </span>
          <span className="grid text-sm">
            <span className="font-medium">{member.name}</span>
            <span className="text-muted-foreground">{member.mood}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
