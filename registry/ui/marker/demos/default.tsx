import { PinIcon } from "lucide-react";
import { Marker, MarkerContent, MarkerIcon } from "@/registry/ui/marker/marker";

export default function MarkerDefaultDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Marker>
        <MarkerIcon>
          <PinIcon />
        </MarkerIcon>
        <MarkerContent>Hana pinned the chapter 12 schedule.</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerContent>Ren renamed the chat to "Rooftop arc".</MarkerContent>
      </Marker>
    </div>
  );
}
