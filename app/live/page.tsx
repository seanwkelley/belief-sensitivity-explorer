"use client";

import { useState, useMemo } from "react";
import type { QuestionDetail, AggregateMetrics } from "@/lib/types";
import { CausalNetwork } from "@/components/causal-network";
import { ProbeTable } from "@/components/probe-table";
import { DeltaBarChart } from "@/components/probe-chart";
import { MetricsPanel } from "@/components/metrics-panel";
import { ProbabilityBar } from "@/components/probability-bar";
import { InteractiveProbe } from "@/components/interactive-probe";
import { formatProbability, probToColor } from "@/lib/utils";

interface DetailWithMetrics extends QuestionDetail {
  aggregate_metrics: AggregateMetrics;
}

const MODELS = [
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
  { value: "qwen/qwen3-235b-a22b-2507", label: "Qwen3 235B" },
  { value: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3" },
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
  { value: "mistralai/mistral-large-2411", label: "Mistral Large" },
];

interface ModelRun {
  model: string;
  label: string;
  result: DetailWithMetrics | null;
  loading: boolean;
  error: string | null;
}

export default function LivePage() {
  const [question, setQuestion] = useState("");
  const [background, setBackground] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([MODELS[0].value]);
  const [apiKey, setApiKey] = useState("");
  const [runs, setRuns] = useState<ModelRun[]>([]);

  function toggleModel(value: string) {
    setSelectedModels((prev) => {
      if (prev.includes(value)) {
        if (prev.length <= 1) return prev; // keep at least one
        return prev.filter((m) => m !== value);
      }
      if (prev.length >= 4) return prev; // max 4
      return [...prev, value];
    });
  }

  const anyLoading = runs.some((r) => r.loading);

  async function handleAnalyze() {
    if (!question.trim() || selectedModels.length === 0) return;

    const newRuns: ModelRun[] = selectedModels.map((m) => ({
      model: m,
      label: MODELS.find((mod) => mod.value === m)?.label ?? m,
      result: null,
      loading: true,
      error: null,
    }));
    setRuns(newRuns);

    // Run all models in parallel
    for (let i = 0; i < selectedModels.length; i++) {
      const model = selectedModels[i];
      (async () => {
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: question.trim(),
              background: background.trim() || undefined,
              resolution_date: resolutionDate || undefined,
              model,
              api_key: apiKey || undefined,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${res.status}`);
          }

          const data = await res.json();
          setRuns((prev) =>
            prev.map((r) =>
              r.model === model ? { ...r, result: data, loading: false } : r
            )
          );
        } catch (err) {
          setRuns((prev) =>
            prev.map((r) =>
              r.model === model
                ? {
                    ...r,
                    error: err instanceof Error ? err.message : "Unknown error",
                    loading: false,
                  }
                : r
            )
          );
        }
      })();
    }
  }

  // Completed runs for comparison table
  const completedRuns = runs.filter((r) => r.result != null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Live Analysis Mode</h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
        Enter a custom forecasting question, select one or more models, and
        generate causal networks with sensitivity probes in real-time via
        OpenRouter.
      </p>

      {/* Question format guidance */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-secondary)]/50 p-4 mb-6">
        <h3 className="text-sm font-medium mb-2">Question Format</h3>
        <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed mb-2">
          This tool is designed for{" "}
          <strong className="text-[var(--color-foreground)]">
            binary yes/no forecasting questions
          </strong>{" "}
          with a specific resolution date. The model estimates a single
          probability (0&ndash;100%) that the event occurs. Multi-outcome or
          open-ended questions are not supported.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[var(--color-positive)] font-medium mb-1">
              Good examples
            </p>
            <ul className="space-y-1 text-[var(--color-muted-foreground)]">
              <li>
                &ldquo;Will the Fed cut interest rates before July 2026?&rdquo;
              </li>
              <li>
                &ldquo;Will SpaceX land Starship successfully by Dec
                2026?&rdquo;
              </li>
              <li>
                &ldquo;Will global average temperature in 2026 exceed 1.5&#176;C
                above pre-industrial levels?&rdquo;
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[var(--color-destructive)] font-medium mb-1">
              Won&apos;t work well
            </p>
            <ul className="space-y-1 text-[var(--color-muted-foreground)]">
              <li>
                &ldquo;What will Trump do about tariffs?&rdquo; (open-ended)
              </li>
              <li>
                &ldquo;Who will win the 2028 election?&rdquo; (multi-outcome)
              </li>
              <li>
                &ldquo;Rank these policies by impact&rdquo; (not a forecast)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Input form */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Question{" "}
              <span className="text-[var(--color-destructive)]">*</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will [event] happen before [date]?"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Background Context
            </label>
            <textarea
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Additional context about the question..."
              rows={3}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-y"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Resolution Date
              </label>
              <input
                type="date"
                value={resolutionDate}
                onChange={(e) => setResolutionDate(e.target.value)}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                API Key{" "}
                <span className="text-[var(--color-muted-foreground)] font-normal">
                  (optional)
                </span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-..."
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Model selection */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Models
            </label>
            <p className="text-xs text-[var(--color-muted-foreground)] mb-2">
              Click to toggle models. Select up to 4 to run them in parallel and compare results side-by-side.
              <span className="ml-1 font-mono text-[var(--color-primary)]">
                {selectedModels.length}/4 selected
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {MODELS.map((m) => {
                const selected = selectedModels.includes(m.value);
                const atMax = selectedModels.length >= 4 && !selected;
                return (
                  <button
                    key={m.value}
                    onClick={() => toggleModel(m.value)}
                    disabled={atMax}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      selected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
                        : atMax
                          ? "border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] opacity-40 cursor-not-allowed"
                          : "border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-muted-foreground)]"
                    }`}
                  >
                    {selected ? <span className="mr-1">✓</span> : <span className="mr-1 opacity-40">○</span>}
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={anyLoading || !question.trim() || selectedModels.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {anyLoading
              ? "Analyzing..."
              : selectedModels.length > 1
                ? `Analyze with ${selectedModels.length} Models`
                : "Analyze"}
          </button>
        </div>
      </div>

      {/* Loading indicators */}
      {runs.some((r) => r.loading) && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 mb-6">
          <div className="space-y-2">
            {runs.map((r) => (
              <div key={r.model} className="flex items-center gap-3">
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center text-[10px] ${
                    r.result
                      ? "border-[var(--color-positive)] text-[var(--color-positive)]"
                      : r.error
                        ? "border-[var(--color-destructive)] text-[var(--color-destructive)]"
                        : "border-[var(--color-primary)] animate-pulse"
                  }`}
                >
                  {r.result ? "✓" : r.error ? "✗" : ""}
                </div>
                <span
                  className={`text-sm ${r.loading ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]"}`}
                >
                  {r.label}
                  {r.loading && (
                    <span className="text-xs text-[var(--color-muted-foreground)] ml-2">
                      Running pipeline...
                    </span>
                  )}
                  {r.result && (
                    <span className="text-xs ml-2" style={{ color: probToColor(r.result.initial_probability) }}>
                      {formatProbability(r.result.initial_probability)}
                    </span>
                  )}
                  {r.error && (
                    <span className="text-xs text-[var(--color-destructive)] ml-2">
                      Failed
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-model comparison table */}
      {completedRuns.length > 1 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 mb-6">
          <h3 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-3">
            Model Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[var(--color-muted-foreground)]">
                  <th className="text-left py-1 pr-4">Metric</th>
                  {completedRuns.map((r) => (
                    <th key={r.model} className="text-right py-1 px-3">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">Baseline P</td>
                  {completedRuns.map((r) => (
                    <td
                      key={r.model}
                      className="py-1.5 px-3 text-right"
                      style={{ color: probToColor(r.result!.initial_probability) }}
                    >
                      {formatProbability(r.result!.initial_probability)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">Nodes / Edges</td>
                  {completedRuns.map((r) => (
                    <td key={r.model} className="py-1.5 px-3 text-right">
                      {r.result!.network_analysis.n_nodes} / {r.result!.network_analysis.n_edges}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">SSR</td>
                  {completedRuns.map((r) => (
                    <td key={r.model} className="py-1.5 px-3 text-right">
                      {r.result!.aggregate_metrics.ssr?.toFixed(2) ?? "N/A"}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">Mean |Δ|</td>
                  {completedRuns.map((r) => (
                    <td key={r.model} className="py-1.5 px-3 text-right">
                      {r.result!.summary.mean_absolute_shift != null
                        ? (r.result!.summary.mean_absolute_shift * 100).toFixed(1) + "pp"
                        : "N/A"}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">Asymmetry</td>
                  {completedRuns.map((r) => (
                    <td key={r.model} className="py-1.5 px-3 text-right">
                      {r.result!.aggregate_metrics.asymmetry_index?.toFixed(2) ?? "N/A"}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">FNAR</td>
                  {completedRuns.map((r) => (
                    <td key={r.model} className="py-1.5 px-3 text-right">
                      {r.result!.aggregate_metrics.fnar != null
                        ? (r.result!.aggregate_metrics.fnar * 100).toFixed(0) + "%"
                        : "N/A"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-model results */}
      {runs
        .filter((r) => r.result || r.error)
        .map((run) => (
          <div key={run.model} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold">{run.label}</h2>
              {run.result && (
                <span
                  className="text-lg font-mono font-bold"
                  style={{ color: probToColor(run.result.initial_probability) }}
                >
                  {formatProbability(run.result.initial_probability)}
                </span>
              )}
            </div>

            {run.error && (
              <div className="rounded-lg border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 p-4">
                <p className="text-sm text-[var(--color-destructive)]">
                  {run.error}
                </p>
              </div>
            )}

            {run.result && (
              <LiveResultPanel
                result={run.result}
                apiKey={apiKey}
                model={run.model}
              />
            )}
          </div>
        ))}
    </div>
  );
}

function LiveResultPanel({
  result,
  apiKey,
  model,
}: {
  result: DetailWithMetrics;
  apiKey: string;
  model: string;
}) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const selectedInfo = useMemo(() => {
    if (!selectedNode) return { type: null, description: null };
    const node = result.network_analysis.node_metrics.find(
      (n) => n.node_id === selectedNode
    );
    if (node) return { type: "node" as const, description: node.description };
    const edge = result.network_analysis.edge_metrics.find(
      (e) => `${e.source}->${e.target}` === selectedNode
    );
    if (edge) return { type: "edge" as const, description: edge.mechanism };
    return { type: null, description: null };
  }, [result, selectedNode]);

  return (
    <div className="space-y-6">
      {/* Baseline */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <ProbabilityBar probability={result.initial_probability} label="Baseline" />
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)] leading-relaxed">
          {result.reasoning}
        </p>
      </div>

      {/* Network + Interactive Probe + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h3 className="text-sm font-semibold mb-3">
            Causal Network
            <span className="font-normal text-[var(--color-muted-foreground)] ml-2">
              Click a node to probe it
            </span>
          </h3>
          <CausalNetwork
            nodes={result.network_analysis.node_metrics}
            edges={result.network_analysis.edge_metrics}
            probeResults={result.probe_results}
            onNodeClick={setSelectedNode}
            selectedNodeId={selectedNode}
            height={400}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-card)] p-4">
            <InteractiveProbe
              questionText={result.question_text}
              initialProbability={result.initial_probability}
              reasoning={result.reasoning}
              nodes={result.nodes}
              edges={result.edges}
              selectedTargetId={selectedNode}
              selectedTargetType={selectedInfo.type}
              selectedTargetDescription={selectedInfo.description}
              defaultApiKey={apiKey}
              defaultModel={model}
            />
          </div>

          <MetricsPanel
            metrics={result.aggregate_metrics}
            network={result.network_analysis}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <h3 className="text-sm font-semibold mb-3">Delta Distribution</h3>
        <DeltaBarChart
          results={result.probe_results}
          initialProbability={result.initial_probability}
        />
      </div>

      {/* Probes */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Automated Probe Results</h3>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(result, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `live-${result.question_id}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            Export JSON
          </button>
        </div>
        <ProbeTable
          results={result.probe_results}
          initialProbability={result.initial_probability}
          onSelectProbe={setSelectedNode}
          selectedTargetId={selectedNode}
        />
      </div>
    </div>
  );
}
