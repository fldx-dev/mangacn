import { cn } from "cn";
import * as React from "react";
import { Stamp } from "@/components/stamp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// Based on shadcn/ui login-01 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Drawn in ink: the card on paper at the heavy outline width, the title in the display face, and
// one spot-red stamp on its corner. The items draw everything; the form only lays them out. The
// title is the page's heading and names the form, so the form is a landmark of its own.

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const titleId = React.useId();
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="[&>[data-slot=ink-frame]]:[--outline-width:var(--outline-width-heavy)]">
        <CardHeader className="relative pe-16">
          <CardTitle>
            <h1 id={titleId} className="font-display text-2xl leading-tight uppercase">
              Login to your account
            </h1>
          </CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
          <Stamp
            lang="ja"
            vertical
            size="sm"
            rotate={8}
            aria-hidden
            className="absolute -top-2 end-3"
          >
            受付
          </Stamp>
        </CardHeader>
        <CardContent>
          <form aria-labelledby={titleId}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" placeholder="m@example.com" required />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit">Login</Button>
                <Button variant="outline" type="button">
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/signup">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
