"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { QuestionDetail, AggregateMetrics } from "@/lib/types";
import { CausalNetwork } from "@/components/causal-network";
import { ProbeTable } from "@/components/probe-table";
import { DeltaBarChart, ImportanceSensitivityScatter } from "@/components/probe-chart";
import { MetricsPanel } from "@/components/metrics-panel";
import { ProbabilityBar } from "@/components/probability-bar";
import { InteractiveProbe } from "@/components/interactive-probe";
import { formatProbability, probToColor } from "@/lib/utils";

interface DetailWithMetrics extends QuestionDetail {
  aggregate_metrics: AggregateMetrics;
}

export default function QuestionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<DetailWithMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [activeViz, setActiveViz] = useState<"delta" | "scatter">("delta");

  useEffect(() => {
    fetch(`/data/questions/${id}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Determine selected target type and description
  const selectedInfo = useMemo(() => {
    if (!data || !selectedTargetId) return { type: null, description: null };

    // Check if it's a node
    const node = data.network_analysis.node_metrics.find(
      (n) => n.node_id === selectedTargetId
    );
    if (node) {
      return { type: "node" as const, description: node.description };
    }

    // Check if it's an edge (format: "source->target")
    const edge = data.network_analysis.edge_metrics.find(
      (e) => `${e.source}->${e.target}` === selectedTargetId
    );
    if (edge) {
      return { type: "edge" as const, description: edge.mechanism };
    }

    return { type: null, description: null };
  }, [data, selectedTargetId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="animate-pulse text-[var(--color-muted-foreground)]">
          Loading question detail...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Question Not Found</h1>
        <p className="text-[var(--color-muted-foreground)]">
          Could not find question with ID: {id}
        </p>
        <Link
          href="/explore"
          className="mt-4 inline-block text-[var(--color-primary)] hover:underline"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] mb-4">
        <Link href="/explore" className="hover:text-[var(--color-foreground)]">
          Explore
        </Link>
        <span>/</span>
        <span className="text-[var(--color-foreground)]">{id}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold leading-snug">{data.question_text}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-[var(--color-muted-foreground)]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-xs">
            {data.source}
          </span>
          <span className="font-mono text-xs">{data.condition}</span>
        </div>
      </div>

      {/* Baseline */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Baseline Forecast</h2>
          <span
            className="text-2xl font-mono font-bold"
            style={{ color: probToColor(data.initial_probability) }}
          >
            {formatProbability(data.initial_probability)}
          </span>
        </div>
        <ProbabilityBar probability={data.initial_probability} showValue={false} />
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)] leading-relaxed">
          {data.reasoning}
        </p>
      </div>

      {/* Main content: Graph + Interactive Probe + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mb-6">
        {/* Causal Network */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-sm font-semibold mb-3">
            Causal Network
            <span className="font-normal text-[var(--color-muted-foreground)] ml-2">
              Click a node to probe it
            </span>
          </h2>
          <CausalNetwork
            nodes={data.network_analysis.node_metrics}
            edges={data.network_analysis.edge_metrics}
            probeResults={data.probe_results}
            onNodeClick={setSelectedTargetId}
            selectedNodeId={selectedTargetId}
            height={450}
          />
        </div>

        {/* Right sidebar: Interactive Probe + Metrics */}
        <div className="space-y-6">
          {/* Interactive Probe Panel */}
          <div className="rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-card)] p-4">
            <InteractiveProbe
              questionText={data.question_text}
              initialProbability={data.initial_probability}
              reasoning={data.reasoning}
              nodes={data.nodes}
              edges={data.edges}
              selectedTargetId={selectedTargetId}
              selectedTargetType={selectedInfo.type}
              selectedTargetDescription={selectedInfo.description}
            />
          </div>

          {/* Metrics */}
          <MetricsPanel
            metrics={data.aggregate_metrics}
            network={data.network_analysis}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold">Visualizations</h2>
          <div className="flex items-center gap-1 ml-auto">
            {(
              [
                ["delta", "Delta Distribution"],
                ["scatter", "Importance vs Sensitivity"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveViz(key)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  activeViz === key
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {activeViz === "delta" ? (
          <DeltaBarChart
            results={data.probe_results}
            initialProbability={data.initial_probability}
          />
        ) : (
          <ImportanceSensitivityScatter results={data.probe_results} />
        )}
      </div>

      {/* Probe table */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <h2 className="text-sm font-semibold mb-4">Pre-computed Probe Results</h2>
        <ProbeTable
          results={data.probe_results}
          initialProbability={data.initial_probability}
          onSelectProbe={setSelectedTargetId}
          selectedTargetId={selectedTargetId}
        />
      </div>
    </div>
  );
}
