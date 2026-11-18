import { AppSidebar } from "@/registry/blocks/sidebar-14/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/registry/ui/sidebar/sidebar";

// The page's sidebar on its own, on the right as in the page, filling the stage; /view/sidebar-14
// is the whole page. The stage around the demo is already the page's main, so a <div> stands in
// for the page's SidebarInset.
export default function Sidebar14DefaultDemo() {
  return (
    <SidebarProvider className="fixed inset-0">
      <div className="flex flex-1 justify-end p-4">
        <SidebarTrigger className="rotate-180" />
      </div>
      <AppSidebar side="right" />
    </SidebarProvider>
  );
}
