import { AppSidebar } from "./components/app-sidebar";
import { Panel } from "@/components/panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-12 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// A studio's schedule in ink: the sidebar holds a month calendar and the studio's calendars, and
// slides away (Ctrl/⌘+B or the trigger) or becomes a sheet on phones. Where stock leaves twenty
// grey squares, the month is blank manga panels; a hand-drawn rule closes the sticky header.

const TONES = ["none", "halftone", "none", "lines", "none"] as const;

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 overflow-x-clip bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>October 2026</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Separator className="absolute inset-x-0 bottom-0" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <h1 className="font-display text-2xl leading-tight uppercase">Release schedule</h1>
          <div className="grid auto-rows-min gap-4 md:grid-cols-5">
            {Array.from({ length: 20 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stock's twenty blank days, never reordered.
              <Panel key={i} as="div" tone={TONES[i % TONES.length]} className="aspect-square" />
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
