import { Avatar, AvatarFallback, AvatarImage } from "@/registry/ui/avatar/avatar";
import { portrait } from "./portrait";

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
