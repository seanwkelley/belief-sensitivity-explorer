import Link from "next/link";

async function getStats() {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const dataPath = path.join(process.cwd(), "public/data/summary.json");
    const raw = await fs.readFile(dataPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6">
      <p className="text-sm text-[var(--color-muted-foreground)]">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      {sub && (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {sub}
        </p>
      )}
    </div>
  );
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-1.5 text-xs text-[var(--color-muted-foreground)] mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          Research Demo
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          How Sensitive Are
          <br />
          <span className="text-[var(--color-primary)]">LLM Forecasts</span> to
          Causal Assumptions?
        </h1>
        <p className="mt-4 text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto leading-relaxed">
          Explore how language model probability estimates shift when
          assumptions about causal structure &mdash; individual factors, causal
          links, and network topology &mdash; are challenged through targeted
          counterfactual probes.
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)] max-w-xl mx-auto">
          Designed for <strong className="text-[var(--color-foreground)]">binary yes/no forecasting questions</strong> with
          a resolution date &mdash; the model estimates a single probability that
          the event occurs.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary)]/90 transition-colors"
          >
            Explore Questions
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/live"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-secondary)] transition-colors"
          >
            Try Live Mode
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Questions Analyzed"
          value={stats?.total_questions?.toString() ?? "—"}
          sub={stats?.model ? `Model: ${stats.model}` : undefined}
        />
        <StatCard
          label="Avg Sensitivity (SSR)"
          value={
            stats?.avg_ssr != null ? stats.avg_ssr.toFixed(2) + "×" : "—"
          }
          sub="High-importance / low-importance shift ratio"
        />
        <StatCard
          label="Avg Forecast Shift"
          value={
            stats?.avg_mean_shift != null
              ? (stats.avg_mean_shift * 100).toFixed(1) + "pp"
              : "—"
          }
          sub="Mean |Δ| across all probes"
        />
      </div>

      {/* Method overview */}
      <div className="mt-16">
        <h2 className="text-xl font-semibold mb-6">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Causal Forecast",
              desc: "The LLM generates a probability estimate along with an explicit causal network — nodes representing factors and directed edges representing causal mechanisms.",
            },
            {
              step: "2",
              title: "Network Analysis",
              desc: "Graph metrics (betweenness, PageRank, path relevance) identify which nodes and edges are structurally most important to the reasoning.",
            },
            {
              step: "3",
              title: "Probe Experiments",
              desc: "~16 targeted probes challenge individual beliefs — negating nodes, severing edges, fabricating connections — and measure the resulting probability shift.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="font-medium">{item.title}</h3>
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics overview */}
      <div className="mt-16">
        <h2 className="text-xl font-semibold mb-6">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              name: "SSR (Sensitivity-to-Structure Ratio)",
              desc: "Ratio of mean shift from high-importance probes vs low-importance probes. SSR > 1 means the model is more sensitive to structurally important components.",
            },
            {
              name: "Asymmetry Index",
              desc: "Ratio of negation shift vs strengthening shift. Values > 1 indicate the model reacts more to challenges than confirmations.",
            },
            {
              name: "FNAR (False Negative Acceptance Rate)",
              desc: "Fraction of fabricated/missing-node probes that cause a significant shift. High FNAR suggests the model accepts spurious evidence.",
            },
            {
              name: "Critical Path Premium",
              desc: "Extra sensitivity for nodes/edges on the shortest path to the outcome vs those off-path.",
            },
          ].map((m) => (
            <div
              key={m.name}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4"
            >
              <h3 className="text-sm font-medium font-mono text-[var(--color-primary)]">
                {m.name}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
