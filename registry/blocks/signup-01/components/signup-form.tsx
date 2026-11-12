import { cn } from "cn";
import * as React from "react";
import { Stamp } from "@/components/stamp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// Based on shadcn/ui signup-01 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Drawn in ink as login-01 is: the card on paper at the heavy outline width, the title in the
// display face, and one spot-red stamp on its corner. The items draw everything; the form only
// lays them out. The title is the page's heading and names the form, so the form is a landmark.

export function SignupForm({ className, ...props }: React.ComponentProps<typeof Card>) {
  const titleId = React.useId();
  return (
    <Card
      className={cn(
        "[&>[data-slot=ink-frame]]:[--outline-width:var(--outline-width-heavy)]",
        className,
      )}
      {...props}
    >
      <CardHeader className="relative pe-16">
        <CardTitle>
          <h1 id={titleId} className="font-display text-2xl leading-tight uppercase">
            Create an account
          </h1>
        </CardTitle>
        <CardDescription>Enter your information below to create your account</CardDescription>
        <Stamp
          lang="ja"
          vertical
          size="sm"
          rotate={-6}
          aria-hidden
          className="absolute -top-2 end-3"
        >
          登録
        </Stamp>
      </CardHeader>
      <CardContent>
        <form aria-labelledby={titleId}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input id="name" type="text" placeholder="John Doe" autoComplete="name" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                required
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" autoComplete="new-password" required />
              <FieldDescription>Must be at least 8 characters long.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
              <Input id="confirm-password" type="password" autoComplete="new-password" required />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit">Create Account</Button>
                <Button variant="outline" type="button">
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <a href="/login">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
