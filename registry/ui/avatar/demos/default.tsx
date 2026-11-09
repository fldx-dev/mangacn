import { Avatar, AvatarFallback, AvatarImage } from "@/registry/ui/avatar/avatar";

// Any image URL works; this portrait (head and shoulders on screentone) is an inline SVG, so the
// demo loads no network image.
const face = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><pattern id="t" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.9" fill="#9a9a9a"/></pattern></defs>
<rect width="64" height="64" fill="#f4f1ea"/>
<rect width="64" height="64" fill="url(#t)"/>
<path d="M10 64c2-14 12-20 22-20s20 6 22 20z" fill="#222"/>
<circle cx="32" cy="28" r="13" fill="#f4f1ea" stroke="#222" stroke-width="2"/>
<path d="M18 26c2-12 26-16 28 0-6-6-18-7-28 0z" fill="#222"/>
</svg>`;
const portrait = `data:image/svg+xml,${encodeURIComponent(face)}`;

export default function AvatarDefaultDemo() {
  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage src={portrait} alt="Mangaka portrait" />
        <AvatarFallback>MK</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>ED</AvatarFallback>
      </Avatar>
    </div>
  );
}
