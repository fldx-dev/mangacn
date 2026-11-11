import { InkFrame } from "@/components/ink-frame";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/registry/ui/resizable/resizable";

export default function ResizableVerticalDemo() {
  return (
    <InkFrame className="w-full max-w-sm rounded-lg">
      <ResizablePanelGroup orientation="vertical" className="min-h-64">
        <ResizablePanel defaultSize="35%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-display text-lg">Header</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="65%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-display text-lg">Page</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </InkFrame>
  );
}
