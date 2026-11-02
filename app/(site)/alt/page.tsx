import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import { AltSections } from "@/components/docs/landing-alt/alt-sections";
import { baseOptions } from "@/lib/docs/layout.shared";

// The alternative landing, kept at /alt while the two versions are compared.
export const metadata: Metadata = { title: "mangacn · landing B", robots: { index: false } };

export default function AltHome() {
  return (
    <HomeLayout {...baseOptions()}>
      <AltSections />
    </HomeLayout>
  );
}
