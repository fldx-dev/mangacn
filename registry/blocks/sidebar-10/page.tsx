import { AppSidebar } from "./components/app-sidebar";
import { NavActions } from "./components/nav-actions";
import { Panel } from "@/components/panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-10 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// A studio's notebook in ink: the notes-app sidebar collapses (Ctrl/⌘+B or the trigger) and
// becomes a sheet on phones; the header carries the note's breadcrumb and its actions. The inset
// is the page's one `main`, the note's title its h1, and where stock leaves grey boxes, the note
// is blank manga panels.

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">
                    Chapter 12 Script & Storyboard
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-3">
            <NavActions />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 px-4 py-10">
          <h1 className="mx-auto w-full max-w-3xl font-display text-2xl leading-tight uppercase">
            Chapter 12 Script & Storyboard
          </h1>
          <Panel as="div" tone="halftone" className="mx-auto h-24 w-full max-w-3xl" />
          <Panel as="div" className="mx-auto h-full w-full max-w-3xl" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
