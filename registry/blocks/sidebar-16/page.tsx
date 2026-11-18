import { AppSidebar } from "./components/app-sidebar";
import { SiteHeader } from "./components/site-header";
import { Panel } from "@/components/panel";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-16 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// A studio's app shell in ink under a sticky site header: the header, the page's one banner, stays
// above the sidebar while the page scrolls, and its button (or Ctrl/⌘+B) slides the sidebar away;
// on phones the sidebar is a sheet. Where stock leaves grey boxes, the page is blank manga panels.

export const iframeHeight = "800px";

export const description = "A sidebar with a header and a search form.";

export default function Page() {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <h1 className="font-display text-2xl leading-tight uppercase">
                Storyboards: chapter 13
              </h1>
              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <Panel as="div" tone="halftone" className="aspect-video" />
                <Panel as="div" tone="lines" className="aspect-video" />
                <Panel as="div" tone="cross" className="aspect-video" />
              </div>
              <Panel as="div" className="min-h-screen flex-1 md:min-h-min" />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
