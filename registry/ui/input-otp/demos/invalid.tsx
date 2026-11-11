"use client";

import * as React from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/registry/ui/input-otp/input-otp";

export default function InputOTPInvalidDemo() {
  const [value, setValue] = React.useState("482910");
  return (
    <div className="grid gap-2">
      <InputOTP
        maxLength={6}
        value={value}
        onChange={setValue}
        aria-label="Verification code"
        aria-invalid
        aria-describedby="input-otp-invalid-error"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p id="input-otp-invalid-error" className="text-sm text-destructive">
        That code has expired. Ask for a new one.
      </p>
    </div>
  );
}
