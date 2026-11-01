import { HomeLayout } from "fumadocs-ui/layouts/home";
import { LandingSections } from "@/components/docs/landing/landing-sections";
import { baseOptions } from "@/lib/docs/layout.shared";

// The landing (SPEC-docs-site §4.1): the Fumadocs navbar, then the sections, all built from
// registry items and prerendered from the catalog and the demo map.
export default function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <LandingSections />
    </HomeLayout>
  );
}
