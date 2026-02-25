"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import type { ProbeResult } from "@/lib/types";
import { probeTypeLabel } from "@/lib/utils";

export function DeltaBarChart({
  results,
  initialProbability,
}: {
  results: ProbeResult[];
  initialProbability: number;
}) {
  const data = results
    .filter((r) => r.updated_probability != null)
    .map((r) => ({
      name: `${probeTypeLabel(r.probe_type)}\n${r.target_id}`,
      shortName: r.target_id.length > 15 ? r.target_id.slice(0, 14) + "…" : r.target_id,
      delta: (r.updated_probability! - initialProbability) * 100,
      type: r.probe_category,
      absShift: (r.absolute_shift ?? 0) * 100,
    }))
    .sort((a, b) => a.delta - b.delta);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="shortName"
            tick={{ fontSize: 9, fill: "#a1a1aa" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(0)}pp`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: 12,
            }}
            formatter={(value: number) => [
              `${value > 0 ? "+" : ""}${value.toFixed(1)}pp`,
              "Δ Probability",
            ]}
            labelFormatter={(label: string) => label}
          />
          <ReferenceLine y={0} stroke="#a1a1aa" strokeWidth={1} />
          <Bar dataKey="delta" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.delta >= 0 ? "#ef4444" : "#22c55e"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ImportanceSensitivityScatter({
  results,
}: {
  results: ProbeResult[];
}) {
  const data = results
    .filter((r) => r.absolute_shift != null && r.target_importance > 0)
    .map((r) => ({
      importance: r.target_importance,
      sensitivity: (r.absolute_shift ?? 0) * 100,
      name: r.target_id,
      category: r.probe_category,
    }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            type="number"
            dataKey="importance"
            name="Importance"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            label={{
              value: "Composite Importance",
              position: "bottom",
              fontSize: 11,
              fill: "#a1a1aa",
            }}
          />
          <YAxis
            type="number"
            dataKey="sensitivity"
            name="Sensitivity"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickFormatter={(v: number) => `${v.toFixed(0)}pp`}
            label={{
              value: "|Δ| (pp)",
              angle: -90,
              position: "insideLeft",
              fontSize: 11,
              fill: "#a1a1aa",
            }}
          />
          <ZAxis range={[40, 400]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [
              name === "Importance"
                ? value.toFixed(3)
                : `${value.toFixed(1)}pp`,
              name,
            ]}
          />
          <Scatter data={data} fill="#3b82f6" fillOpacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
