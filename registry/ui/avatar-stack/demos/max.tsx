import { AvatarStack } from "@/registry/ui/avatar-stack/avatar-stack";

const readers = [
  "Aiko Mori",
  "Kenji Arata",
  "Sora Hayashi",
  "Yuki Tanabe",
  "Haru Ogawa",
  "Mei Kato",
  "Ren Fujita",
  "Nao Ishida",
  "Taro Endo",
  "Emi Kubo",
  "Riku Sato",
  "Hina Abe",
].map((name) => ({ name }));

const sizes = ["sm", "default", "lg"] as const;

// A reading group of twelve: five faces, the rest behind "+7" and its tooltip.
export default function AvatarStackMaxDemo() {
  return (
    <div className="flex flex-col items-center gap-4">
      {sizes.map((size) => (
        <AvatarStack
          key={size}
          items={readers}
          max={5}
          size={size}
          aria-label={`Reading group, ${size} avatars`}
        />
      ))}
    </div>
  );
}
