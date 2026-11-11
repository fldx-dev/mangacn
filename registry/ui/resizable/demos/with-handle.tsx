import { InkFrame } from "@/components/ink-frame";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/registry/ui/resizable/resizable";

export default function ResizableWithHandleDemo() {
  return (
    <InkFrame className="w-full max-w-md rounded-lg">
      <ResizablePanelGroup orientation="horizontal" className="min-h-48">
        <ResizablePanel defaultSize="30%" minSize="20%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-display text-lg">Script</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="70%" minSize="30%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-display text-lg">Storyboard</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </InkFrame>
  );
}
