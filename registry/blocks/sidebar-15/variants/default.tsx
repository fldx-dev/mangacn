import { SidebarLeft } from "@/registry/blocks/sidebar-15/components/sidebar-left";
import { SidebarRight } from "@/registry/blocks/sidebar-15/components/sidebar-right";
import { SidebarProvider, SidebarTrigger } from "@/registry/ui/sidebar/sidebar";

// The page's two sidebars on their own, filling the stage; /view/sidebar-15 is the whole page. The
// stage around the variant is already the page's main, so a <div> stands in for the page's
// SidebarInset.
export default function Sidebar15DefaultVariant() {
  return (
    <SidebarProvider className="fixed inset-0">
      <SidebarLeft />
      <div className="flex-1 p-4">
        <SidebarTrigger />
      </div>
      <SidebarRight />
    </SidebarProvider>
  );
}
