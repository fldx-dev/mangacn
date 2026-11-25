import { AppSidebar } from "./components/app-sidebar";
import { Panel } from "@/components/panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Link } from "@/lib/link";

// Based on shadcn/ui sidebar-02 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// A studio handbook's shell in ink: each section of the sidebar opens and closes, the sidebar
// slides away (Ctrl/⌘+B or the trigger) and becomes a sheet on phones. The header sticks to the
// top on the inset's own paper (raised over the panels, which stack on their own), ruled by the
// separator's ink line; stock's 24 grey strips are a storyboard's blank panels.

const THUMBNAILS = Array.from({ length: 24 }, (_, index) => index + 1);

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* The rule's rough ends overhang its box: the header clips them at the window's edge. */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background px-4 overflow-x-clip">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link href="#" />}>Make a chapter</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Thumbnails</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Separator className="absolute inset-x-0 bottom-0" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <h1 className="font-display text-2xl leading-tight uppercase">
            Thumbnails: plan the page before the pencils
          </h1>
          {THUMBNAILS.map((page) => (
            <Panel key={page} as="div" className="aspect-video h-12 w-full" />
          ))}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
