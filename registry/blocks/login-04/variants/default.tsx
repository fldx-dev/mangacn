import { LoginForm } from "@/registry/blocks/login-04/components/login-form";

// The page's card on its own, at the width the page gives it; /view/login-04 is the whole page.
export default function Login04DefaultVariant() {
  return <LoginForm className="w-full max-w-sm md:max-w-4xl" />;
}
