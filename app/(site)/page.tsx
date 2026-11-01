import { HomeLayout } from "fumadocs-ui/layouts/home";
import Link from "next/link";
import { baseOptions } from "@/lib/docs/layout.shared";

// Placeholder landing until the landing sections land (SPEC-docs-site §4.1).
export default function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="font-display text-5xl sm:text-7xl">mangacn</h1>
        <p className="max-w-md text-balance font-dialogue text-lg text-muted-foreground">
          Manga-styled React components, distributed as a shadcn registry. Docs are coming.
        </p>
        <pre className="w-full max-w-full overflow-x-auto rounded-lg border bg-muted px-4 py-3 text-left font-mono text-sm sm:w-auto">
          <code>npx shadcn@latest add @mangacn/&lt;item&gt;</code>
        </pre>
        <Link href="/demo" className="font-dialogue underline underline-offset-4 hover:text-spot">
          Browse the gallery →
        </Link>
      </div>
    </HomeLayout>
  );
}
