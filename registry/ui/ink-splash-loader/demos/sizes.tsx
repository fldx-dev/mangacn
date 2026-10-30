import { InkSplashLoader } from "@/registry/ui/ink-splash-loader/ink-splash-loader";

export default function InkSplashLoaderSizesDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <InkSplashLoader size="sm" label="Loading chapter" />
      <InkSplashLoader size="md" label="Loading page" />
      <InkSplashLoader size="lg" label="Inking" />
      <p className="flex items-center gap-2 text-sm">
        <InkSplashLoader size="sm" label="Saving" className="text-spot" />
        Saving…
      </p>
    </div>
  );
}
