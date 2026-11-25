import { cn } from "cn";
import * as React from "react";
import { Stamp } from "@/components/stamp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/link";

// Based on shadcn/ui signup-01 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Drawn in ink as login-01 is: the card on paper at the heavy outline width, the title in the
// display face, and one spot-red stamp on its corner. The items draw everything; the form only
// lays them out. The title is the page's heading and names the form, so the form is a landmark.

const signIn = (
  <>
    Already have an account? <Link href="/login">Sign in</Link>
  </>
);

export interface SignupFormProps extends Omit<React.ComponentProps<typeof Card>, "title"> {
  /**
   * The heading, which also names the form.
   * @default "Create an account"
   */
  title?: React.ReactNode;
  /**
   * The line under the heading.
   * @default "Enter your information below to create your account"
   */
  description?: React.ReactNode;
  /**
   * The other providers' buttons, under Create Account. `null` draws none.
   * @default a "Sign up with Google" button
   */
  providers?: React.ReactNode;
  /**
   * The line under the buttons.
   * @default "Already have an account?" and a "Sign in" link to /login
   */
  footer?: React.ReactNode;
}

export function SignupForm({
  className,
  title = "Create an account",
  description = "Enter your information below to create your account",
  providers = (
    <Button variant="outline" type="button">
      Sign up with Google
    </Button>
  ),
  footer = signIn,
  ...props
}: SignupFormProps) {
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
            {title}
          </h1>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
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
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
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
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />
              <FieldDescription>Must be at least 8 characters long.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit">Create Account</Button>
                {providers}
                <FieldDescription className="px-6 text-center">{footer}</FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
