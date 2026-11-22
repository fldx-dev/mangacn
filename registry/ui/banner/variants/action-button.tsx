import { CalendarClockIcon } from "lucide-react";
import { Banner, BannerAction, BannerContent, BannerIcon } from "@/registry/ui/banner/banner";
import { Button } from "@/registry/ui/button/button";

// A studio's deadline notice: no close button, since it stays until the pages are in.
export default function BannerActionButtonVariant() {
  return (
    <Banner labels={{ region: "Deadline" }} className="max-w-2xl">
      <BannerIcon>
        <CalendarClockIcon />
      </BannerIcon>
      <BannerContent>Chapter 13 inks are due Friday. 6 of 20 pages are in.</BannerContent>
      <BannerAction>
        <Button size="sm" variant="outline">
          Open the board
        </Button>
      </BannerAction>
    </Banner>
  );
}
