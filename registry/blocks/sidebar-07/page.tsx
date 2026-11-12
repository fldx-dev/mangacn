import { AppSidebar } from "@/components/app-sidebar";
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

// Based on shadcn/ui sidebar-07 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// A studio's app shell in ink: mangacn's sidebar collapses to icons (Ctrl/⌘+B or the trigger) and
// becomes a sheet on phones. The inset is the page's one `main`; where stock leaves grey boxes,
// the chapter's page is blank manga panels, three toned and one tall, so the items draw it all.

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Moonlit Ronin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Chapter 12</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <h1 className="font-display text-2xl leading-tight uppercase">
            Chapter 12: The last ferry
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
