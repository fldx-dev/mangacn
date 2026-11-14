import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import ThemeSpecimen from "@/app/demo/[item]/[demo]/theme-specimen";
import { CreatePage } from "@/components/create/create-page";
import { baseOptions } from "@/lib/docs/layout.shared";
import { OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Create a manga theme for shadcn/ui",
  description:
    "Choose a look, a pen, screentone, fonts and a starter kit, and watch real mangacn components take them. The short code in the address keeps the whole configuration.",
  // Every `?c=<code>` is the same page with another configuration; search engines index one.
  alternates: { canonical: "/create" },
  // Replaces the root's whole openGraph object (metadata merges shallowly).
  openGraph: {
    type: "website",
    siteName: "mangacn",
    url: "/create",
    title: "Create a manga theme for shadcn/ui · mangacn",
    description:
      "Choose a look, a pen, screentone, fonts and a starter kit, and watch real mangacn components take them.",
    images: [OG_IMAGE],
  },
};

// The Create page: a static shell (the code is read from `?c=` on the client, so nothing here
// waits on the request) around the interactive page. The preview shows the theme specimen, the
// same dozen items as `/demo/theme/specimen`, rendered here on the server.
export default function Create() {
  return (
    <HomeLayout {...baseOptions()}>
      <CreatePage>
        <ThemeSpecimen />
      </CreatePage>
    </HomeLayout>
  );
}
