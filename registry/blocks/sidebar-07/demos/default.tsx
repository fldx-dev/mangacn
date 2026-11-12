import { AppSidebar } from "@/registry/blocks/sidebar-07/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/registry/ui/sidebar/sidebar";

// The page's sidebar on its own, filling the stage; /view/sidebar-07 is the whole page. The stage
// around the demo is already the page's main, so a <div> stands in for the page's SidebarInset.
export default function Sidebar07DefaultDemo() {
  return (
    <SidebarProvider className="fixed inset-0">
      <AppSidebar />
      <div className="flex-1 p-4">
        <SidebarTrigger />
      </div>
    </SidebarProvider>
  );
}
