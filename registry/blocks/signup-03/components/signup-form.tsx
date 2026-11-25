import { cn } from "cn";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/link";

// Based on shadcn/ui signup-03 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Drawn in ink as login-03 is: the card on paper at the heavy outline width and the title in the
// display face; the two passwords side by side, as stock sets them. The items draw everything;
// the form only lays them out. The title is the page's heading and names the form.

const signIn = (
  <>
    Already have an account? <Link href="/login">Sign in</Link>
  </>
);

export interface SignupFormProps extends Omit<React.ComponentProps<"div">, "title"> {
  /**
   * The heading, which also names the form.
   * @default "Create your account"
   */
  title?: React.ReactNode;
  /**
   * The line under the heading.
   * @default "Enter your email below to create your account"
   */
  description?: React.ReactNode;
  /**
   * The line under Create Account.
   * @default "Already have an account?" and a "Sign in" link to /login
   */
  footer?: React.ReactNode;
}

export function SignupForm({
  className,
  title = "Create your account",
  description = "Enter your email below to create your account",
  footer = signIn,
  ...props
}: SignupFormProps) {
  const titleId = React.useId();
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="[&>[data-slot=ink-frame]]:[--outline-width:var(--outline-width-heavy)]">
        <CardHeader className="text-center">
          <CardTitle>
            <h1 id={titleId} className="font-display text-2xl leading-tight uppercase">
              {title}
            </h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form aria-labelledby={titleId}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input id="name" name="name" type="text" placeholder="John Doe" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input id="password" name="password" type="password" minLength={8} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                    <Input id="confirm-password" name="confirm-password" type="password" required />
                  </Field>
                </Field>
                <FieldDescription>Must be at least 8 characters long.</FieldDescription>
              </Field>
              <Field>
                <Button type="submit">Create Account</Button>
                <FieldDescription className="text-center">{footer}</FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  );
}
