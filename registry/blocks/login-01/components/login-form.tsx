import { cn } from "cn";
import * as React from "react";
import { Stamp } from "@/components/stamp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/link";

// Based on shadcn/ui login-01 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Drawn in ink: the card on paper at the heavy outline width, the title in the display face, and
// one spot-red stamp on its corner. The items draw everything; the form only lays them out. The
// title is the page's heading and names the form, so the form is a landmark of its own.

const signUp = (
  <>
    Don&apos;t have an account? <Link href="/signup">Sign up</Link>
  </>
);

export interface LoginFormProps extends Omit<React.ComponentProps<"div">, "title"> {
  /**
   * The heading, which also names the form.
   * @default "Login to your account"
   */
  title?: React.ReactNode;
  /**
   * The line under the heading.
   * @default "Enter your email below to login to your account"
   */
  description?: React.ReactNode;
  /**
   * The other providers' buttons, under Login. `null` draws none.
   * @default a "Login with Google" button
   */
  providers?: React.ReactNode;
  /**
   * The line under the buttons.
   * @default "Don't have an account?" and a "Sign up" link to /signup
   */
  footer?: React.ReactNode;
  /**
   * Where "Forgot your password?" goes. Without it the link is not drawn: no mangacn item
   * installs a password-reset page.
   */
  forgotPasswordHref?: string;
}

export function LoginForm({
  className,
  forgotPasswordHref,
  title = "Login to your account",
  description = "Enter your email below to login to your account",
  providers = (
    <Button variant="outline" type="button">
      Login with Google
    </Button>
  ),
  footer = signUp,
  ...props
}: LoginFormProps) {
  const titleId = React.useId();
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="[&>[data-slot=ink-frame]]:[--outline-width:var(--outline-width-heavy)]">
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
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  {forgotPasswordHref ? (
                    <Link
                      href={forgotPasswordHref}
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  ) : null}
                </div>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit">Login</Button>
                {providers}
                <FieldDescription className="text-center">{footer}</FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
