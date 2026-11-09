"use client";

import { BookmarkIcon, Share2Icon } from "lucide-react";
import * as React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/registry/ui/context-menu/context-menu";
import { Panel } from "@/registry/ui/panel/panel";

export default function ContextMenuSubmenuDemo() {
  const panel = React.useRef<HTMLDivElement>(null);
  // Opens the menu where a reader would right-click (near the panel's corner, clear of the
  // hint), so this page shows it open. In an app, drop the effect: a right-click or a
  // long-press on the panel opens it.
  React.useEffect(() => {
    const open = () => {
      const target = panel.current;
      if (!target) return;
      const { left, top } = target.getBoundingClientRect();
      target.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: left + 16,
          clientY: top + 16,
        }),
      );
    };
    // After the web fonts, so the panel has its final size when the menu is placed.
    if (document.fonts) document.fonts.ready.then(open);
    else open();
  }, []);

  return (
    <ContextMenu>
      <ContextMenuTrigger ref={panel} className="w-full max-w-md">
        <Panel className="min-h-64 items-center justify-end">
          <p className="text-center text-sm text-muted-foreground">
            Right-click or long-press the panel
          </p>
        </Panel>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-40">
        <ContextMenuItem>
          <BookmarkIcon />
          Bookmark
        </ContextMenuItem>
        <ContextMenuSub defaultOpen>
          <ContextMenuSubTrigger>
            <Share2Icon />
            Share
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Copy link</ContextMenuItem>
            <ContextMenuItem>Copy image</ContextMenuItem>
            <ContextMenuItem>Email</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
