import { SignupForm } from "@/registry/blocks/signup-04/components/signup-form";

// The page's card on its own, at the width the page gives it; /view/signup-04 is the whole page.
export default function Signup04DefaultVariant() {
  return <SignupForm className="w-full max-w-sm md:max-w-4xl" />;
}
