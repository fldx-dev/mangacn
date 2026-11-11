import { InkFrame } from "@/components/ink-frame";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/registry/ui/resizable/resizable";

export default function ResizableDefaultDemo() {
  return (
    <InkFrame className="w-full max-w-sm rounded-lg">
      <ResizablePanelGroup orientation="horizontal" className="min-h-48">
        <ResizablePanel defaultSize="50%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-display text-lg">Splash</span>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="50%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize="25%">
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-display text-lg">Panel 2</span>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize="75%">
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-display text-lg">Panel 3</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </InkFrame>
  );
}
