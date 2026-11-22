"use client";

import { SettingsIcon } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/ui/popover/popover";
import { Switch } from "@/registry/ui/switch/switch";
import { ToggleGroup, ToggleGroupItem } from "@/registry/ui/toggle-group/toggle-group";

export default function PopoverReadingSettingsVariant() {
  return (
    <Popover defaultOpen>
      <PopoverTrigger
        render={<Button variant="outline" size="icon" aria-label="Reading settings" />}
      >
        <SettingsIcon />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Reading settings</PopoverTitle>
        </PopoverHeader>
        <ToggleGroup aria-label="Page layout" variant="outline" spacing={0} defaultValue={["page"]}>
          <ToggleGroupItem value="page">Page</ToggleGroupItem>
          <ToggleGroupItem value="spread">Spread</ToggleGroupItem>
          <ToggleGroupItem value="scroll">Scroll</ToggleGroupItem>
        </ToggleGroup>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="reading-settings-rtl">Right to left</label>
          <Switch id="reading-settings-rtl" defaultChecked />
        </div>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="reading-settings-dim">Dim the page edges</label>
          <Switch id="reading-settings-dim" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
