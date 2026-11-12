import { LoginForm } from "@/components/login-form";

// Based on shadcn/ui login-01 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// The page is a `main`, the one landmark a login page needs; the form is centred on the paper.

export default function Page() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  );
}
