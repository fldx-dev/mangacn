"use client";

import { HeartIcon } from "lucide-react";
import { Rating } from "@/registry/ui/rating/rating";

// The card under a chapter's last page: readers rate it in hearts, not stars.
export default function RatingHeartIconsVariant() {
  return (
    <section
      aria-labelledby="rating-hearts-title"
      className="flex w-full max-w-sm flex-col items-center gap-2 text-center"
    >
      <h3 id="rating-hearts-title" className="font-medium">
        End of chapter 12
      </h3>
      <p id="rating-hearts-prompt" className="text-sm text-muted-foreground">
        How much did you love this chapter?
      </p>
      <Rating
        aria-labelledby="rating-hearts-prompt"
        name="chapter-12"
        defaultValue={3}
        icon={<HeartIcon strokeWidth={1.75} />}
        labels={{ item: (n, max) => `${n} of ${max} hearts` }}
      />
    </section>
  );
}
