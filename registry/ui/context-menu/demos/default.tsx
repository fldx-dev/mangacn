"use client";

import { BookmarkIcon, CopyIcon, FlagIcon, LanguagesIcon } from "lucide-react";
import * as React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/registry/ui/context-menu/context-menu";
import { Panel } from "@/registry/ui/panel/panel";

export default function ContextMenuDefaultDemo() {
  const panel = React.useRef<HTMLDivElement>(null);
  // Opens the menu where a reader would right-click, so this page shows it open. In an app,
  // drop the effect: a right-click or a long-press on the panel opens it.
  React.useEffect(() => {
    const open = () => {
      const target = panel.current;
      if (!target) return;
      const { left, top, width, height } = target.getBoundingClientRect();
      target.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: left + width / 4,
          clientY: top + height / 4,
        }),
      );
    };
    // After the web fonts, so the panel has its final size when the menu is placed.
    if (document.fonts) document.fonts.ready.then(open);
    else open();
  }, []);

  return (
    <ContextMenu>
      <ContextMenuTrigger ref={panel} className="w-full max-w-sm">
        <Panel className="min-h-56 items-center justify-center">
          <p className="text-center text-sm text-muted-foreground">
            Right-click or long-press the panel
          </p>
        </Panel>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuGroup>
          <ContextMenuItem>
            <BookmarkIcon />
            Bookmark page
            <ContextMenuShortcut>B</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <CopyIcon />
            Copy panel link
          </ContextMenuItem>
          <ContextMenuItem>
            <LanguagesIcon />
            Show translation
            <ContextMenuShortcut>T</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <FlagIcon />
          Report page
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
