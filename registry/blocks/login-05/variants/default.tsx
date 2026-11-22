import { LoginForm } from "@/registry/blocks/login-05/components/login-form";

// The page's form on its own, at the width the page gives it; /view/login-05 is the whole page.
export default function Login05DefaultVariant() {
  return <LoginForm className="w-full max-w-sm" />;
}
