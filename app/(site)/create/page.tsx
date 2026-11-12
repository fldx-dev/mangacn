import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import ThemeSpecimen from "@/app/demo/[item]/[demo]/theme-specimen";
import { CreatePage } from "@/components/create/create-page";
import { baseOptions } from "@/lib/docs/layout.shared";

export const metadata: Metadata = {
  title: "Create · mangacn",
  description:
    "Choose a look, a pen, screentone, fonts and a starter kit, and watch real mangacn components take them. The short code in the address keeps the whole configuration.",
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
