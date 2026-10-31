import type { Metadata } from "next";
import Link from "next/link";
import { loadRegistry } from "@/lib/registry";
import { listDemos } from "@/lib/registry/demos";

// Gallery index: every item that has demos, grouped by catalog category, linking to the
// per-item page (all demos inline) and to each lone demo stage.

export const metadata: Metadata = { title: "mangacn gallery", robots: { index: false } };

const CATEGORY_ORDER = [
  "primitive",
  "layout",
  "text",
  "background",
  "decoration",
  "feedback",
  "animation",
  "data",
];

interface GalleryItem {
  name: string;
  description?: string;
  demos: string[];
}

export default function DemoIndex() {
  const demos = listDemos();
  const groups = new Map<string, GalleryItem[]>();
  let count = 0;
  for (const item of loadRegistry().items) {
    const own = demos.filter((d) => d.item === item.name).map((d) => d.demo);
    if (own.length === 0) continue;
    count += 1;
    const category = item.categories?.[0] ?? "other";
    const group = groups.get(category) ?? [];
    group.push({ name: item.name, description: item.description, demos: own });
    groups.set(category, group);
  }
  const categories = [...groups.keys()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 text-ink sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl sm:text-5xl">Gallery</h1>
        <p className="font-dialogue text-muted-foreground">
          {demos.length} demos across {count} items. Open an item to see all of its demos on one
          page, light and dark.
        </p>
      </header>
      {categories.map((category) => (
        <section key={category} className="flex flex-col gap-4">
          <h2 className="font-display text-2xl capitalize">{category}</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.get(category)?.map((item) => (
              <li
                key={item.name}
                className="ink-border flex flex-col gap-2 rounded-[var(--radius)] p-4"
              >
                <Link href={`/demo/${item.name}`} className="font-display text-lg hover:text-spot">
                  {item.name}
                </Link>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
                <p className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-1 text-sm">
                  {item.demos.map((demo) => (
                    <Link
                      key={demo}
                      href={`/demo/${item.name}/${demo}`}
                      className="underline underline-offset-4 hover:text-spot"
                    >
                      {demo}
                    </Link>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
