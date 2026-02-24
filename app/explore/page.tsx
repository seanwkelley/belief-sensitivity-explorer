"use client";

import { useState, useEffect, useMemo } from "react";
import { QuestionCard } from "@/components/question-card";
import type { DataSummary, QuestionIndex } from "@/lib/types";

export default function ExplorePage() {
  const [data, setData] = useState<DataSummary | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<
    "initial_probability" | "mean_absolute_shift" | "ssr" | "n_nodes"
  >("mean_absolute_shift");
  const [sortDesc, setSortDesc] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/summary.json")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.questions;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.question_text.toLowerCase().includes(q) ||
          item.question_id.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDesc ? bv - av : av - bv;
    });

    return list;
  }, [data, search, sortKey, sortDesc]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <div className="animate-pulse text-[var(--color-muted-foreground)]">
          Loading questions...
        </div>
      </div>
    );
  }

  if (!data || data.questions.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Explore Questions</h1>
        <p className="text-[var(--color-muted-foreground)]">
          No pre-computed data found. Run{" "}
          <code className="font-mono bg-[var(--color-secondary)] px-1 rounded">
            npm run prepare-data
          </code>{" "}
          to generate data from sensitivity pipeline outputs.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Explore Questions</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {data.total_questions} questions analyzed with{" "}
            {data.model}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Sort:
          </span>
          {(
            [
              ["mean_absolute_shift", "Mean |Δ|"],
              ["ssr", "SSR"],
              ["initial_probability", "Probability"],
              ["n_nodes", "Nodes"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                if (sortKey === key) setSortDesc(!sortDesc);
                else {
                  setSortKey(key);
                  setSortDesc(true);
                }
              }}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                sortKey === key
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {label}
              {sortKey === key && (sortDesc ? " ↓" : " ↑")}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.map((q) => (
          <QuestionCard key={q.question_id} q={q} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-[var(--color-muted-foreground)] py-8">
          No questions match your search.
        </p>
      )}
    </div>
  );
}
