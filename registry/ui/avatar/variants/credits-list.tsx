import { Avatar, AvatarFallback, AvatarImage } from "@/registry/ui/avatar/avatar";

// Any image URL works; this portrait (head and shoulders on screentone) is an inline SVG, so the
// variant loads no network image.
const face = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><pattern id="t" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.9" fill="#9a9a9a"/></pattern></defs>
<rect width="64" height="64" fill="#f4f1ea"/>
<rect width="64" height="64" fill="url(#t)"/>
<path d="M10 64c2-14 12-20 22-20s20 6 22 20z" fill="#222"/>
<circle cx="32" cy="28" r="13" fill="#f4f1ea" stroke="#222" stroke-width="2"/>
<path d="M18 26c2-12 26-16 28 0-6-6-18-7-28 0z" fill="#222"/>
</svg>`;
const portrait = `data:image/svg+xml,${encodeURIComponent(face)}`;

// Only the author has a picture; everyone else falls back to their initials.
const credits = [
  { name: "Mika Kondo", role: "Story and art", initials: "MK", image: portrait },
  { name: "Ren Aoki", role: "Assistant, backgrounds", initials: "RA" },
  { name: "Sora Ito", role: "Lettering", initials: "SI" },
  { name: "Eri Dan", role: "Editor", initials: "ED" },
];

export default function AvatarCreditsListVariant() {
  return (
    <div className="grid w-full max-w-xs gap-3">
      <span id="avatar-credits-list-title" className="text-sm font-medium">
        Chapter 12 credits
      </span>
      <ul aria-labelledby="avatar-credits-list-title" className="grid gap-3">
        {credits.map((person) => (
          <li key={person.name} className="flex items-center gap-3">
            <Avatar size="lg">
              {person.image && <AvatarImage src={person.image} alt="" />}
              <AvatarFallback>{person.initials}</AvatarFallback>
            </Avatar>
            <div className="grid">
              <span className="text-sm font-medium">{person.name}</span>
              <span className="text-sm text-muted-foreground">{person.role}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
