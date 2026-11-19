import { AvatarStack } from "@/registry/ui/avatar-stack/avatar-stack";

const authors = [
  { name: "Aiko Mori" },
  { name: "Kenji Arata" },
  { name: "Sora Hayashi" },
  { name: "Yuki Tanabe" },
];

export default function AvatarStackDefaultDemo() {
  return <AvatarStack items={authors} aria-label="Authors of Ink & Steel" />;
}
