"use client";

import { cn } from "cn";
import { useId, useState } from "react";
import { Switch } from "@/registry/ui/switch/switch";
import { HeroProduct } from "./hero-product";
import { StockCard } from "./stock-card";

/** One switch, the same card twice: stock on the left of the switch, mangacn on the right. */
export function SwapToggle() {
  const id = useId();
  const [drawn, setDrawn] = useState(true);
  return (
    <div data-slot="swap-toggle" className="flex w-full min-w-0 flex-col gap-5">
      <div className="flex items-center justify-center gap-3 text-sm">
        <span className={cn(drawn && "text-muted-foreground")}>Stock shadcn</span>
        <Switch id={id} checked={drawn} onCheckedChange={setDrawn} aria-label="Draw with mangacn" />
        <label htmlFor={id} className={cn("font-display", !drawn && "text-muted-foreground")}>
          mangacn
        </label>
      </div>
      <div className="relative mx-auto w-full max-w-sm">
        <div hidden={drawn}>
          <StockCard />
        </div>
        <div hidden={!drawn}>
          <HeroProduct />
        </div>
      </div>
    </div>
  );
}
