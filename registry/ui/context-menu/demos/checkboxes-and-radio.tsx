"use client";

import * as React from "react";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/registry/ui/context-menu/context-menu";
import { Panel } from "@/registry/ui/panel/panel";

export default function ContextMenuCheckboxesAndRadioDemo() {
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
      <ContextMenuTrigger ref={panel} className="w-full max-w-sm">
        <Panel tone="halftone" className="min-h-72 items-center justify-end">
          <p className="bg-paper px-2 text-center text-sm">Right-click or long-press the panel</p>
        </Panel>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuGroup>
          <ContextMenuLabel>Reading direction</ContextMenuLabel>
          <ContextMenuRadioGroup defaultValue="rtl">
            <ContextMenuRadioItem value="rtl">Right to left</ContextMenuRadioItem>
            <ContextMenuRadioItem value="ltr">Left to right</ContextMenuRadioItem>
            <ContextMenuRadioItem value="vertical">Vertical scroll</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Text</ContextMenuLabel>
          <ContextMenuCheckboxItem defaultChecked>
            Furigana <span lang="ja">ふりがな</span>
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem>SFX translations</ContextMenuCheckboxItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
