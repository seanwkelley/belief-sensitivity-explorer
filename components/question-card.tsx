"use client";

import Link from "next/link";
import { truncate } from "@/lib/utils";

interface QuestionEntry {
  question_id: string;
  question_text: string;
  source: string;
  models: string[];
}

export function QuestionCard({
  q,
  model,
}: {
  q: QuestionEntry;
  model: string;
}) {
  return (
    <Link
      href={`/explore/${q.question_id}?model=${model}`}
      className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-card)]/80 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug group-hover:text-[var(--color-primary)] transition-colors">
            {truncate(q.question_text, 120)}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-secondary)] px-2 py-0.5">
              {q.source}
            </span>
            <span className="text-xs">
              {q.models.length} model{q.models.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-[var(--color-muted-foreground)]">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
