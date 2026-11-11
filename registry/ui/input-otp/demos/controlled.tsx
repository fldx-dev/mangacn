"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import * as React from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/registry/ui/input-otp/input-otp";

export default function InputOTPControlledDemo() {
  const [value, setValue] = React.useState("");
  return (
    <div className="grid gap-2">
      <InputOTP
        maxLength={4}
        pattern={REGEXP_ONLY_DIGITS}
        value={value}
        onChange={setValue}
        aria-label="Locker PIN"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {value === "" ? "Enter the four digits on your ticket." : `You entered ${value}.`}
      </p>
    </div>
  );
}
