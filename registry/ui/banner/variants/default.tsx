import { MegaphoneIcon } from "lucide-react";
import { Banner, BannerClose, BannerContent, BannerIcon } from "@/registry/ui/banner/banner";

export default function BannerDefaultVariant() {
  return (
    <Banner className="max-w-2xl">
      <BannerIcon>
        <MegaphoneIcon />
      </BannerIcon>
      <BannerContent>
        Chapter 112 of Ink &amp; Steel is out. New chapters every Friday.
      </BannerContent>
      <BannerClose />
    </Banner>
  );
}
