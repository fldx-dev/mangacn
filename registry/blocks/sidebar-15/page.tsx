import { SidebarLeft } from "./components/sidebar-left";
import { SidebarRight } from "./components/sidebar-right";
import { Panel } from "@/components/panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-15 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// A studio's notebook in ink between two sidebars: the notes on the left, the schedule on the
// right. Ctrl/⌘+B or the trigger puts both away; on phones the left is a sheet and the right is
// hidden, as in stock. Where stock leaves grey boxes, the note is blank manga panels.

export default function Page() {
  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-background">
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
                    Moonlit Ronin: series bible
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <h1 className="mx-auto w-full max-w-3xl font-display text-2xl leading-tight uppercase">
            Moonlit Ronin: series bible
          </h1>
          <Panel as="div" tone="halftone" className="mx-auto h-24 w-full max-w-3xl" />
          <Panel as="div" className="mx-auto h-[100vh] w-full max-w-3xl" />
        </div>
      </SidebarInset>
      <SidebarRight />
    </SidebarProvider>
  );
}
