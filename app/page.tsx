export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">mangacn</h1>
      <p className="max-w-md text-balance text-muted-foreground">
        Manga-styled React components, distributed as a shadcn registry. Docs are coming.
      </p>
      <pre className="w-full max-w-full overflow-x-auto rounded-lg border bg-muted px-4 py-3 text-left font-mono text-sm sm:w-auto">
        <code>npx shadcn@latest add @mangacn/&lt;item&gt;</code>
      </pre>
    </main>
  );
}
