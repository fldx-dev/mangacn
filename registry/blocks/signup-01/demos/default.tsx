import { SignupForm } from "@/registry/blocks/signup-01/components/signup-form";

// The page's form on its own, at the width the page gives it; /view/signup-01 is the whole page.
export default function Signup01DefaultDemo() {
  return <SignupForm className="w-full max-w-sm" />;
}
