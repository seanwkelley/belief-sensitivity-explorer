"use client";

import type { AggregateMetrics, NetworkAnalysis } from "@/lib/types";

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <p className="text-xs font-mono text-[var(--color-muted-foreground)] uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        {description}
      </p>
    </div>
  );
}

export function MetricsPanel({
  metrics,
  network,
}: {
  metrics: AggregateMetrics;
  network: NetworkAnalysis;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
        Aggregate Metrics
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="SSR"
          value={metrics.ssr != null ? metrics.ssr.toFixed(2) + "×" : "N/A"}
          description={`High: ${(metrics.mean_shift_high * 100).toFixed(1)}pp / Low: ${(metrics.mean_shift_low * 100).toFixed(1)}pp`}
        />
        <MetricCard
          label="Asymmetry"
          value={
            metrics.asymmetry_index != null
              ? metrics.asymmetry_index.toFixed(2) + "×"
              : "N/A"
          }
          description={`Negate: ${(metrics.mean_shift_negate * 100).toFixed(1)}pp / Strengthen: ${(metrics.mean_shift_strengthen * 100).toFixed(1)}pp`}
        />
        <MetricCard
          label="FNAR"
          value={
            metrics.fnar != null
              ? (metrics.fnar * 100).toFixed(0) + "%"
              : "N/A"
          }
          description={`${metrics.n_accepted}/${metrics.n_fabricated} fabricated probes accepted`}
        />
        <MetricCard
          label="Crit. Path Premium"
          value={
            metrics.critical_path_premium != null
              ? (metrics.critical_path_premium * 100).toFixed(1) + "pp"
              : "N/A"
          }
          description={`On-path: ${(metrics.mean_shift_on_path * 100).toFixed(1)}pp / Off: ${(metrics.mean_shift_off_path * 100).toFixed(1)}pp`}
        />
      </div>

      <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mt-4">
        Network Stats
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Nodes"
          value={network.n_nodes.toString()}
          description={`DAG: ${network.is_dag ? "Yes" : "No"}`}
        />
        <MetricCard
          label="Edges"
          value={network.n_edges.toString()}
          description={`Density: ${network.density.toFixed(3)}`}
        />
      </div>
      {metrics.importance_sensitivity_correlation != null && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-xs font-mono text-[var(--color-muted-foreground)] uppercase tracking-wider">
            Importance-Sensitivity ρ
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            {metrics.importance_sensitivity_correlation.toFixed(3)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Spearman correlation between structural importance and probe
            sensitivity
          </p>
        </div>
      )}
    </div>
  );
}
