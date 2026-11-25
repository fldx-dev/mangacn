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

// Based on shadcn/ui sidebar-03 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// A studio handbook's shell in ink: the sidebar shows every section with its pages, slides away
// (Ctrl/⌘+B or the trigger) and becomes a sheet on phones. The inset is the page's one `main`;
// stock's header rule is the separator's ink line, and its grey boxes are blank manga panels.

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* The rule's rough ends overhang its box: the header clips them at the window's edge. */}
        <header className="relative flex h-16 shrink-0 items-center gap-2 overflow-x-clip">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
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
          </div>
          <Separator className="absolute inset-x-0 bottom-0" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <h1 className="font-display text-2xl leading-tight uppercase">
            Thumbnails: plan the page before the pencils
          </h1>
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <Panel as="div" tone="halftone" className="aspect-video" />
            <Panel as="div" tone="lines" className="aspect-video" />
            <Panel as="div" tone="cross" className="aspect-video" />
          </div>
          <Panel as="div" className="min-h-[100vh] flex-1 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
