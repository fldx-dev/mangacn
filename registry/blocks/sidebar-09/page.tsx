import type * as React from "react";
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

// Based on shadcn/ui sidebar-09 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// A studio's post in ink: nested sidebars, the mailboxes as an icon rail and the open mailbox's
// letters beside it, collapsing to the rail (Ctrl/⌘+B or the trigger) and a sheet on phones. The
// inset is the page's one `main`; its header stays on top on the paper, without stock's rule,
// and where stock leaves grey bars, the letter's lines are blank manga panels.

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 bg-background p-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link href="#" />}>All Inboxes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Inbox</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <h1 className="font-display text-2xl leading-tight uppercase">Chapter 12 deadline</h1>
          {Array.from({ length: 24 }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: blank panels, never reordered.
            <Panel key={index} as="div" className="aspect-video h-12 w-full" />
          ))}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
