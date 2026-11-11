"use client";

import { cn } from "cn";
import { OTPInput, OTPInputContext } from "input-otp";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Input OTP (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Restyled for mangacn: each slot is a paper box with its own hand-drawn outline, the active
// slot traced again at the heavy width with an ink caret (steady under reduced motion), groups
// parted by a hand-drawn dash; invalid slots ink in the spot colour. No CSS border, no ring.

/** FNV-1a over `useId()`: the slot's two outlines share it, so the heavy one lands on the light. */
function useSlotSeed(): number {
  const id = React.useId();
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // rough.js treats 0 as "random".
  return (hash >>> 0) % 2147483646 || 1;
}

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "cn-input-otp flex items-center has-disabled:opacity-100 has-disabled:text-muted-foreground has-disabled:[--paper:transparent] has-disabled:**:data-[slot=input-otp-slot]:halftone-light has-[input[aria-invalid=true]]:[--ink:var(--destructive)]",
        containerClassName,
      )}
      spellCheck={false}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        "flex items-center gap-1 rounded-lg has-aria-invalid:[--ink:var(--destructive)]",
        className,
      )}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};
  const seed = useSlotSeed();

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative isolate flex size-8 items-center justify-center rounded-md bg-background text-sm transition-all outline-none has-[>[data-inked=true]]:bg-transparent! aria-invalid:[--ink:var(--destructive)] data-[active=true]:z-10",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        seed={seed}
        fill="paper"
        className="pointer-events-none absolute inset-0 -z-1 rounded-md"
      />
      {isActive && (
        // The active slot: the same outline again at the heavy width, in place of stock's ring.
        <InkFrame
          as="span"
          seed={seed}
          fill="none"
          className="pointer-events-none absolute inset-0 -z-1 rounded-md [--outline-width:var(--outline-width-heavy)]"
        />
      )}
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-(--outline-width-heavy) bg-ink duration-1000 motion-safe:animate-caret-blink" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: stock's <div role="separator">, kept rather than retagged.
    <div
      data-slot="input-otp-separator"
      className="flex items-center [&_svg:not([class*='size-'])]:size-4"
      role="separator"
      {...props}
    >
      {/* A short hand-drawn dash in place of stock's minus icon. */}
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        className="pointer-events-none mx-1 h-(--outline-width-heavy) w-3 [--outline-width:var(--outline-width-heavy)]"
      />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
