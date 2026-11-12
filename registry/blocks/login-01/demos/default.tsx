import { LoginForm } from "@/registry/blocks/login-01/components/login-form";

// The page's form on its own, at the width the page gives it; /view/login-01 is the whole page.
export default function Login01DefaultDemo() {
  return <LoginForm className="w-full max-w-sm" />;
}
