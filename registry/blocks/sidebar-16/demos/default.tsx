import { AppSidebar } from "@/registry/blocks/sidebar-16/components/app-sidebar";
import { SiteHeader } from "@/registry/blocks/sidebar-16/components/site-header";
import { SidebarProvider } from "@/registry/ui/sidebar/sidebar";

// The page's header and sidebar on their own, filling the stage; /view/sidebar-16 is the whole
// page. The stage around the demo is already the page's main, so a <div> stands in for the page's
// SidebarInset.
export default function Sidebar16DefaultDemo() {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="fixed inset-0 flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <div className="flex-1" />
        </div>
      </SidebarProvider>
    </div>
  );
}
