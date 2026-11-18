import type * as React from "react";
import { AppSidebar } from "@/registry/blocks/sidebar-09/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/registry/ui/sidebar/sidebar";

// The page's sidebar on its own, filling the stage; /view/sidebar-09 is the whole page. The stage
// around the demo is already the page's main, so a <div> stands in for the page's SidebarInset.
export default function Sidebar09DefaultDemo() {
  return (
    <SidebarProvider
      className="fixed inset-0"
      style={{ "--sidebar-width": "350px" } as React.CSSProperties}
    >
      <AppSidebar />
      <div className="flex-1 p-4">
        <SidebarTrigger />
      </div>
    </SidebarProvider>
  );
}
