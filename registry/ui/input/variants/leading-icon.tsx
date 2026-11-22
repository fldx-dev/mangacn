import { SearchIcon } from "lucide-react";
import { Input } from "@/registry/ui/input/input";

export default function InputLeadingIconVariant() {
  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <label htmlFor="leading-icon-search" className="text-sm font-medium">
        Search the library
      </label>
      {/* The input cannot hold the icon, so a relative wrapper places it over the field. */}
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="leading-icon-search"
          type="search"
          placeholder="Series, author or tag"
          className="pl-8"
        />
      </div>
    </div>
  );
}
