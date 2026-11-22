"use client";

import { useState } from "react";
import { Button } from "@/registry/ui/button/button";
import { Textarea } from "@/registry/ui/textarea/textarea";

const LIMIT = 280;

export default function TextareaCommentBoxVariant() {
  const [comment, setComment] = useState("That last panel on the rooftop!");

  return (
    <form className="grid w-full max-w-xs gap-1.5" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="comment-box-text" className="text-sm font-medium">
        Comment on chapter 12
      </label>
      <Textarea
        id="comment-box-text"
        value={comment}
        maxLength={LIMIT}
        aria-describedby="comment-box-count"
        onChange={(event) => setComment(event.target.value)}
      />
      <div className="flex items-center justify-between gap-3">
        <p
          id="comment-box-count"
          aria-live="polite"
          className="text-xs text-muted-foreground tabular-nums"
        >
          {LIMIT - comment.length} characters left
        </p>
        <Button type="submit" size="sm" disabled={comment.trim() === ""}>
          Post
        </Button>
      </div>
    </form>
  );
}
