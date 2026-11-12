"use client";

import { SlidersHorizontal } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import type { Mode } from "@/lib/registry/contrast";
import { Alert, AlertDescription, AlertTitle } from "@/registry/ui/alert/alert";
import { Button } from "@/registry/ui/button/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/registry/ui/drawer/drawer";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { Separator } from "@/registry/ui/separator/separator";
import { CreateCodeBar } from "./create-code-bar";
import { CreatePreview } from "./create-preview";
import { CreateRailSections } from "./create-rail";
import { useCreateConfig } from "./use-create-config";

/** The site's mode (next-themes' class on `<html>`), or null before hydration. */
export function useSiteMode(): Mode | null {
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setMode(root.classList.contains("dark") ? "dark" : "light");
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return mode;
}

/**
 * A scroll area that takes the room its flex column leaves: the viewport (`size-full`) cannot
 * resolve a percentage of a flexed height, so it is pinned to the root instead.
 */
const FILL_SCROLL_AREA =
  "min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]]:absolute [&>[data-slot=scroll-area-viewport]]:inset-0";

/** A new seed offset for the drawings: any whole number but 0 (the site's own wobble). */
function newSeed(): number {
  return 1 + Math.floor(Math.random() * 99_999);
}

/**
 * The Create page (`/create`): choices on the left (a drawer on phones and tablets), the live
 * preview on the right, the configuration in one reducer whose code is the URL. `children` is
 * what the preview shows, rendered on the server (the theme specimen).
 */
export function CreatePage({ children }: { children: ReactNode }) {
  const { config, code, dispatch, refused } = useCreateConfig();
  const siteMode = useSiteMode();
  const [chosenMode, setChosenMode] = useState<Mode | null>(null);
  const mode = chosenMode ?? siteMode;
  const [seed, setSeed] = useState(0);

  const sections = (
    <CreateRailSections config={config} dispatch={dispatch} mode={mode ?? "light"} />
  );
  const codeBar = <CreateCodeBar code={code} config={config} dispatch={dispatch} />;
  const note = refused ? (
    <Alert data-slot="create-refused">
      <AlertTitle>That code could not be read</AlertTitle>
      <AlertDescription>{`The code in the address was not used (${refused}), so this is the default. Any choice you make writes a new code.`}</AlertDescription>
    </Alert>
  ) : null;

  return (
    <div
      data-slot="create-page"
      className="grid min-w-0 flex-1 lg:grid-cols-[20rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr]"
    >
      <div className="min-w-0 px-4 pt-6 sm:px-6 lg:col-start-2 lg:row-start-1 lg:px-8">
        <h1 className="font-display text-2xl tracking-wide sm:text-3xl">Create</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Choose a look, a pen and a starter kit, and watch the real components take them. The code
          in the address keeps every choice.
        </p>
      </div>

      <aside
        aria-label="Choices"
        data-slot="create-rail"
        className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] min-h-0 flex-col lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:flex"
      >
        <ScrollArea label="Choices" className={FILL_SCROLL_AREA}>
          <div className="p-5">{sections}</div>
        </ScrollArea>
        <Separator />
        <div className="p-5">{codeBar}</div>
      </aside>

      <div className="min-w-0 px-4 pt-6 pb-28 sm:px-6 lg:col-start-2 lg:row-start-2 lg:px-8 lg:pb-10">
        <CreatePreview
          config={config}
          mode={mode}
          onModeChange={setChosenMode}
          seed={seed}
          onReroll={() => setSeed(newSeed())}
          note={note}
        >
          {children}
        </CreatePreview>
      </div>

      <Drawer modal="trap-focus">
        <DrawerTrigger
          render={
            <Button
              data-slot="create-drawer-trigger"
              className="fixed inset-x-4 bottom-4 z-40 h-11 lg:hidden"
            />
          }
        >
          <SlidersHorizontal aria-hidden />
          Choices
          <span className="font-mono text-xs opacity-80">{code}</span>
        </DrawerTrigger>
        <DrawerContent
          data-create="drawer"
          className="h-[62dvh] lg:hidden"
        >
          <DrawerHeader className="flex-row items-baseline justify-between gap-3 px-4 pb-2 group-data-[swipe-axis=y]/drawer-popup:text-left">
            <DrawerTitle className="font-display tracking-wide">Choices</DrawerTitle>
            <DrawerDescription className="text-xs">The preview follows every change.</DrawerDescription>
          </DrawerHeader>
          <ScrollArea label="Choices" className={FILL_SCROLL_AREA}>
            <div className="px-4 pb-4">{sections}</div>
          </ScrollArea>
          <Separator />
          <div className="p-4">{codeBar}</div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
