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

// Based on shadcn/ui sidebar-11 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// A chapter's working files in ink: the file tree in mangacn's sidebar, which collapses (Ctrl/⌘+B
// or the trigger) and becomes a sheet on phones. The inset is the page's one `main`; the open
// file's breadcrumb heads it, and where stock leaves grey boxes, the page is blank manga panels.

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link href="#" />}>chapter-12</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link href="#" />}>pages</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>p02.clip</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <h1 className="font-display text-2xl leading-tight uppercase">Chapter 12, page 2</h1>
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
