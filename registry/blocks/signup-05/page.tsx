import { SignupForm } from "./components/signup-form";

// Based on shadcn/ui signup-05 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's email-only sign-up, centred on the paper, as login-05. The page is the one `main`.

export default function SignupPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </main>
  );
}
