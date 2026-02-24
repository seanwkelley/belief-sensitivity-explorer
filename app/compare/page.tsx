"use client";

import { useState, useEffect, useMemo } from "react";
import type { DataSummary, QuestionDetail, AggregateMetrics } from "@/lib/types";
import { CausalNetwork } from "@/components/causal-network";
import { ProbeTable } from "@/components/probe-table";
import { DeltaBarChart } from "@/components/probe-chart";
import { MetricsPanel } from "@/components/metrics-panel";
import { ProbabilityBar } from "@/components/probability-bar";
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

function ModelResult({
  label,
  data,
  loading,
  error,
}: {
  label: string;
  data: DetailWithMetrics | null;
  loading: boolean;
  error: string | null;
}) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex-1 min-w-0 space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-primary)]">{label}</h3>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center">
          <div className="animate-pulse text-[var(--color-muted-foreground)] text-sm">
            Running pipeline...
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
            Generating causal forecast + ~11 probes
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 min-w-0 space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-primary)]">{label}</h3>
        <div className="rounded-lg border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 p-4">
          <p className="text-xs text-[var(--color-destructive)]">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 min-w-0 space-y-4">
      <h3 className="text-sm font-semibold text-[var(--color-primary)]">{label}</h3>

      {/* Baseline */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
        <ProbabilityBar probability={data.initial_probability} label="Baseline" />
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)] leading-relaxed line-clamp-3">
          {data.reasoning}
        </p>
      </div>

      {/* Network */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
        <h4 className="text-xs font-semibold mb-2">
          Causal Network
          <span className="font-normal text-[var(--color-muted-foreground)] ml-1">
            ({data.network_analysis.n_nodes} nodes, {data.network_analysis.n_edges} edges)
          </span>
        </h4>
        <CausalNetwork
          nodes={data.network_analysis.node_metrics}
          edges={data.network_analysis.edge_metrics}
          probeResults={data.probe_results}
          onNodeClick={setSelectedNode}
          selectedNodeId={selectedNode}
          height={350}
        />
      </div>

      {/* Metrics */}
      <MetricsPanel
        metrics={data.aggregate_metrics}
        network={data.network_analysis}
      />

      {/* Chart */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
        <h4 className="text-xs font-semibold mb-2">Delta Distribution</h4>
        <DeltaBarChart
          results={data.probe_results}
          initialProbability={data.initial_probability}
        />
      </div>

      {/* Probes */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
        <h4 className="text-xs font-semibold mb-2">Probe Results</h4>
        <ProbeTable
          results={data.probe_results}
          initialProbability={data.initial_probability}
          onSelectProbe={setSelectedNode}
          selectedTargetId={selectedNode}
        />
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [questionSource, setQuestionSource] = useState<"precomputed" | "custom">("custom");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [customBackground, setCustomBackground] = useState("");
  const [modelA, setModelA] = useState(MODELS[0].value);
  const [modelB, setModelB] = useState(MODELS[1].value);
  const [apiKey, setApiKey] = useState("");

  const [resultA, setResultA] = useState<DetailWithMetrics | null>(null);
  const [resultB, setResultB] = useState<DetailWithMetrics | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/summary.json")
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
  }, []);

  const questionText = useMemo(() => {
    if (questionSource === "custom") return customQuestion.trim();
    if (!summary) return "";
    return summary.questions.find((q) => q.question_id === selectedQuestionId)?.question_text ?? "";
  }, [questionSource, customQuestion, selectedQuestionId, summary]);

  const modelALabel = MODELS.find((m) => m.value === modelA)?.label ?? modelA;
  const modelBLabel = MODELS.find((m) => m.value === modelB)?.label ?? modelB;

  const canRun = questionText.length > 0 && apiKey.length > 0 && modelA !== modelB;

  async function runComparison() {
    if (!canRun) return;

    setResultA(null);
    setResultB(null);
    setErrorA(null);
    setErrorB(null);
    setLoadingA(true);
    setLoadingB(true);

    const body = {
      question: questionText,
      background: customBackground.trim() || undefined,
    };

    // Run both models in parallel
    const runModel = async (
      model: string,
      setResult: (d: DetailWithMetrics) => void,
      setError: (e: string | null) => void,
      setLoading: (l: boolean) => void
    ) => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, model, api_key: apiKey }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    runModel(modelA, setResultA, setErrorA, setLoadingA);
    runModel(modelB, setResultB, setErrorB, setLoadingB);
  }

  const hasResults = resultA || resultB || loadingA || loadingB;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Compare Models</h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
        Run the same question through two different models and compare their
        causal networks, probability estimates, and probe sensitivity side by side.
      </p>

      {/* Setup form */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 mb-6 space-y-4">
        {/* Question source toggle */}
        <div>
          <label className="block text-sm font-medium mb-2">Question</label>
          <div className="flex items-center gap-2 mb-3">
            {(
              [
                ["custom", "Custom question"],
                ["precomputed", "From pre-computed data"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setQuestionSource(key)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  questionSource === key
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {questionSource === "custom" ? (
            <div className="space-y-3">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Will [event] happen before [date]?"
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
              <textarea
                value={customBackground}
                onChange={(e) => setCustomBackground(e.target.value)}
                placeholder="Background context (optional)"
                rows={2}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-y"
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Binary yes/no questions with a resolution date work best.
              </p>
            </div>
          ) : (
            <select
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              <option value="">Select a question...</option>
              {summary?.questions.map((q) => (
                <option key={q.question_id} value={q.question_id}>
                  {q.question_text.length > 100
                    ? q.question_text.slice(0, 99) + "…"
                    : q.question_text}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Model selectors + API key */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Model A</label>
            <select
              value={modelA}
              onChange={(e) => setModelA(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Model B</label>
            <select
              value={modelB}
              onChange={(e) => setModelB(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              OpenRouter API Key
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

        {modelA === modelB && (
          <p className="text-xs text-[var(--color-destructive)]">
            Select two different models to compare.
          </p>
        )}

        <button
          onClick={runComparison}
          disabled={!canRun || loadingA || loadingB}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingA || loadingB ? "Running..." : "Run Comparison"}
        </button>
      </div>

      {/* Comparison summary bar */}
      {resultA && resultB && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 mb-6">
          <h3 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-3">
            Head-to-Head
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[var(--color-muted-foreground)]">
                  <th className="text-left py-1 pr-4">Metric</th>
                  <th className="text-right py-1 px-4">{modelALabel}</th>
                  <th className="text-right py-1 pl-4">{modelBLabel}</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">Baseline P</td>
                  <td className="py-1.5 px-4 text-right" style={{ color: probToColor(resultA.initial_probability) }}>
                    {formatProbability(resultA.initial_probability)}
                  </td>
                  <td className="py-1.5 pl-4 text-right" style={{ color: probToColor(resultB.initial_probability) }}>
                    {formatProbability(resultB.initial_probability)}
                  </td>
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">Nodes / Edges</td>
                  <td className="py-1.5 px-4 text-right">
                    {resultA.network_analysis.n_nodes} / {resultA.network_analysis.n_edges}
                  </td>
                  <td className="py-1.5 pl-4 text-right">
                    {resultB.network_analysis.n_nodes} / {resultB.network_analysis.n_edges}
                  </td>
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">SSR</td>
                  <td className="py-1.5 px-4 text-right">
                    {resultA.aggregate_metrics.ssr?.toFixed(2) ?? "N/A"}
                  </td>
                  <td className="py-1.5 pl-4 text-right">
                    {resultB.aggregate_metrics.ssr?.toFixed(2) ?? "N/A"}
                  </td>
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">Mean |Δ|</td>
                  <td className="py-1.5 px-4 text-right">
                    {resultA.summary.mean_absolute_shift != null
                      ? (resultA.summary.mean_absolute_shift * 100).toFixed(1) + "pp"
                      : "N/A"}
                  </td>
                  <td className="py-1.5 pl-4 text-right">
                    {resultB.summary.mean_absolute_shift != null
                      ? (resultB.summary.mean_absolute_shift * 100).toFixed(1) + "pp"
                      : "N/A"}
                  </td>
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">Asymmetry</td>
                  <td className="py-1.5 px-4 text-right">
                    {resultA.aggregate_metrics.asymmetry_index?.toFixed(2) ?? "N/A"}
                  </td>
                  <td className="py-1.5 pl-4 text-right">
                    {resultB.aggregate_metrics.asymmetry_index?.toFixed(2) ?? "N/A"}
                  </td>
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">FNAR</td>
                  <td className="py-1.5 px-4 text-right">
                    {resultA.aggregate_metrics.fnar != null
                      ? (resultA.aggregate_metrics.fnar * 100).toFixed(0) + "%"
                      : "N/A"}
                  </td>
                  <td className="py-1.5 pl-4 text-right">
                    {resultB.aggregate_metrics.fnar != null
                      ? (resultB.aggregate_metrics.fnar * 100).toFixed(0) + "%"
                      : "N/A"}
                  </td>
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-1.5 pr-4 text-[var(--color-muted-foreground)]">Crit. Path Premium</td>
                  <td className="py-1.5 px-4 text-right">
                    {resultA.aggregate_metrics.critical_path_premium != null
                      ? (resultA.aggregate_metrics.critical_path_premium * 100).toFixed(1) + "pp"
                      : "N/A"}
                  </td>
                  <td className="py-1.5 pl-4 text-right">
                    {resultB.aggregate_metrics.critical_path_premium != null
                      ? (resultB.aggregate_metrics.critical_path_premium * 100).toFixed(1) + "pp"
                      : "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side-by-side results */}
      {hasResults && (
        <div className="flex gap-6 overflow-x-auto">
          <ModelResult
            label={modelALabel}
            data={resultA}
            loading={loadingA}
            error={errorA}
          />
          <div className="w-px bg-[var(--color-border)] shrink-0 hidden lg:block" />
          <ModelResult
            label={modelBLabel}
            data={resultB}
            loading={loadingB}
            error={errorB}
          />
        </div>
      )}
    </div>
  );
}
