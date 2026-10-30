import { CheckIcon } from "lucide-react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/registry/ui/avatar/avatar";
import { portrait } from "./portrait";

const sizes = ["sm", "default", "lg"] as const;

export default function AvatarVariantsDemo() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-4">
        {sizes.map((size) => (
          <Avatar key={size} size={size}>
            <AvatarImage src={portrait} alt={`Mangaka portrait, ${size}`} />
            <AvatarFallback>MK</AvatarFallback>
            <AvatarBadge>
              <CheckIcon />
            </AvatarBadge>
          </Avatar>
        ))}
      </div>
      <AvatarGroup>
        <Avatar>
          <AvatarImage src={portrait} alt="Mangaka" />
          <AvatarFallback>MK</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>ED</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+4</AvatarGroupCount>
      </AvatarGroup>
    </div>
  );
}
