import { GalleryVerticalEndIcon } from "lucide-react";
import { LoginForm } from "./components/login-form";
import { Link } from "@/lib/link";

// Based on shadcn/ui login-03 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's centred card on its muted ground, which in mangacn is the first screentone (tone-1):
// the studio's mark above the card, the terms below it. The page is the one `main`.

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <GalleryVerticalEndIcon aria-hidden className="size-4" />
          Inkpot Studio
        </Link>
        <LoginForm />
      </div>
    </main>
  );
}
