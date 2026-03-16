"use client";

interface EpistemicRating {
  factor_id: string;
  confidence: number;
  reason: string;
  betweenness: number;
  value_of_information: number;
}

function confidenceLabel(c: number): string {
  if (c <= 1) return "Very uncertain";
  if (c <= 2) return "Uncertain";
  if (c <= 3) return "Moderate";
  if (c <= 4) return "Fairly confident";
  return "Very confident";
}

function confidenceColor(c: number): string {
  if (c <= 1) return "text-red-400";
  if (c <= 2) return "text-orange-400";
  if (c <= 3) return "text-yellow-400";
  if (c <= 4) return "text-blue-400";
  return "text-green-400";
}

function voiBar(voi: number, maxVoi: number): number {
  if (maxVoi <= 0) return 0;
  return Math.round((voi / maxVoi) * 100);
}

export function InformationPriorities({
  ratings,
}: {
  ratings: EpistemicRating[];
}) {
  if (!ratings || ratings.length === 0) return null;

  const maxVoi = Math.max(...ratings.map((r) => r.value_of_information), 0.001);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
        Information Priorities
      </h3>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Factors ranked by value of information: high structural importance +
        low epistemic confidence = highest priority for additional research.
      </p>
      <div className="space-y-2">
        {ratings.map((r, i) => (
          <div
            key={r.factor_id}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--color-muted-foreground)] w-5">
                  {i + 1}.
                </span>
                <span className="text-sm font-medium">
                  {r.factor_id.replace(/_/g, " ")}
                </span>
              </div>
              <span
                className={`text-xs font-mono ${confidenceColor(r.confidence)}`}
              >
                {confidenceLabel(r.confidence)} ({r.confidence}/5)
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                  style={{ width: `${voiBar(r.value_of_information, maxVoi)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-[var(--color-muted-foreground)] w-12 text-right">
                VOI {r.value_of_information.toFixed(2)}
              </span>
            </div>
            {r.reason && (
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                {r.reason}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
