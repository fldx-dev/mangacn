import { Banner, BannerAction, BannerClose, BannerContent } from "@/registry/ui/banner/banner";

// The site's top bar: an ink banner with a link as its action.
export default function BannerInvertedDemo() {
  return (
    <Banner variant="inverted" labels={{ region: "Site news" }} className="max-w-2xl">
      <BannerContent>
        mangacn 0.1 ships sixteen new components for forms and dashboards.
      </BannerContent>
      <BannerAction>
        <a href="/docs/components" className="font-medium underline underline-offset-4">
          See what&apos;s new
        </a>
      </BannerAction>
      <BannerClose />
    </Banner>
  );
}
