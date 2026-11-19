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

// Based on shadcn/ui sidebar-08 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// A studio's inset app shell in ink, with a secondary nav at the sidebar's foot: mangacn's sidebar
// collapses (Ctrl/⌘+B or the trigger) and becomes a sheet on phones. The inset is the page's one
// `main`; where stock leaves grey boxes, the volume's pages are blank manga panels.

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
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
                  <BreadcrumbPage>Volume 3</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <h1 className="font-display text-2xl leading-tight uppercase">
            Volume 3: Paper lanterns
          </h1>
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <Panel as="div" tone="halftone" className="aspect-video" />
            <Panel as="div" tone="lines" className="aspect-video" />
            <Panel as="div" tone="cross" className="aspect-video" />
          </div>
          <Panel as="div" className="min-h-screen flex-1 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
