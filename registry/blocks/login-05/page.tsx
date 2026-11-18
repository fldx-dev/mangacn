import { LoginForm } from "./components/login-form";

// Based on shadcn/ui login-05 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's email-only login, centred on the paper. The page is the one `main`.

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  );
}
