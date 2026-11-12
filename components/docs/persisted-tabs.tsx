"use client";

import { CodeBlockTabs } from "fumadocs-ui/components/codeblock";
import { type ComponentProps, useLayoutEffect, useState } from "react";

/** Whether this browser lets the page read and write both storages (a blocked one throws). */
function storageWorks(): boolean {
  const probe = "mangacn-storage-probe";
  try {
    for (const storage of [window.sessionStorage, window.localStorage]) {
      storage.setItem(probe, "1");
      storage.removeItem(probe);
    }
    return true;
  } catch {
    return false;
  }
}

export interface PersistedTabsProps
  extends Omit<ComponentProps<typeof CodeBlockTabs>, "groupId" | "persist"> {
  /** The group the choice is shared and remembered under, when the browser allows storage. */
  groupId: string;
}

/**
 * Fumadocs' code tabs with a remembered choice, for browsers that allow it.
 *
 * With a `groupId`, Fumadocs' tabs read `sessionStorage` and `localStorage` in a layout effect
 * with no guard; where storage is blocked (a privacy setting, some embedded browsers) that read
 * throws and takes the whole docs page down with it. So the group is only handed over once a
 * probe has shown both storages work, in a layout effect of its own: before the first paint,
 * and after hydration, so the server's markup is what the client starts from. Without storage
 * the tabs still switch; the choice is just not remembered.
 */
export function PersistedTabs({ groupId, ...props }: PersistedTabsProps) {
  const [remembered, setRemembered] = useState(false);
  useLayoutEffect(() => {
    setRemembered(storageWorks());
  }, []);
  return (
    <CodeBlockTabs {...props} groupId={remembered ? groupId : undefined} persist={remembered} />
  );
}
