/**
 * Prepares pre-computed sensitivity data for the Next.js app.
 *
 * Reads per-question JSON files from the sensitivity pipeline output
 * and produces:
 *   - public/data/summary.json  (cross-question index + aggregate stats)
 *   - public/data/questions/{id}.json (per-question detail with derived metrics)
 *
 * Usage: npx tsx scripts/prepare-data.ts [inputDir]
 *   inputDir defaults to ../outputs/sensitivity_causal_llama_one-turn/question_results
 */

import * as fs from "fs";
import * as path from "path";

// ------------------------------------------------------------------
// Types (mirror lib/types.ts but for Node — keep in sync manually)
// ------------------------------------------------------------------

interface ProbeResult {
  probe_type: string;
  target_id: string;
  target_type: string;
  target_importance: number;
  target_on_critical_path: boolean;
  probe_category: string;
  absolute_shift: number | null;
  updated_probability: number | null;
  shift_direction: string;
  success: boolean;
  reasoning: string;
  probe_text: string;
  probe_generated: boolean;
  target_centrality_rank: number;
  target_reason_id: string | null;
  raw_response: string;
}

interface QuestionJSON {
  question_id: string;
  question_text: string;
  source: string;
  initial_probability: number;
  nodes: { id: string; description: string; role: string }[];
  edges: { from: string; to: string; mechanism: string }[];
  reasoning: string;
  network_analysis: {
    n_nodes: number;
    n_edges: number;
    density: number;
    is_dag: boolean;
    n_weakly_connected: number;
    n_strongly_connected: number;
    outcome_node: string;
    node_metrics: unknown[];
    edge_metrics: unknown[];
    probe_targets: unknown[];
  };
  probe_targets: unknown[];
  probes: unknown[];
  condition: string;
  probe_results: ProbeResult[];
  summary: {
    question_id: string;
    question_text: string;
    source: string;
    condition: string;
    initial_probability: number;
    n_probes: number;
    n_successful: number;
    mean_absolute_shift: number | null;
    max_absolute_shift: number | null;
  };
}

// ------------------------------------------------------------------
// Metric computation (mirrors analysis_causal.py)
// ------------------------------------------------------------------

const HIGH_TYPES = new Set([
  "node_negate_high",
  "node_strengthen",
  "edge_negate_critical",
]);
const LOW_TYPES = new Set([
  "node_negate_low",
  "edge_negate_peripheral",
  "irrelevant",
]);

function computeMetrics(results: ProbeResult[]) {
  const successful = results.filter(
    (r) => r.success && r.absolute_shift != null
  );

  // SSR
  const highShifts = successful
    .filter((r) => HIGH_TYPES.has(r.probe_type))
    .map((r) => r.absolute_shift!);
  const lowShifts = successful
    .filter((r) => LOW_TYPES.has(r.probe_type))
    .map((r) => r.absolute_shift!);

  const meanHigh =
    highShifts.length > 0
      ? highShifts.reduce((a, b) => a + b, 0) / highShifts.length
      : 0;
  const meanLow =
    lowShifts.length > 0
      ? lowShifts.reduce((a, b) => a + b, 0) / lowShifts.length
      : 0;
  const ssr = meanLow > 0 ? meanHigh / meanLow : null;

  // Asymmetry
  const negateShifts = successful
    .filter((r) => r.probe_type === "node_negate_high")
    .map((r) => r.absolute_shift!);
  const strengthenShifts = successful
    .filter((r) => r.probe_type === "node_strengthen")
    .map((r) => r.absolute_shift!);

  const meanNeg =
    negateShifts.length > 0
      ? negateShifts.reduce((a, b) => a + b, 0) / negateShifts.length
      : 0;
  const meanStr =
    strengthenShifts.length > 0
      ? strengthenShifts.reduce((a, b) => a + b, 0) / strengthenShifts.length
      : 0;
  const asymmetry = meanStr > 0 ? meanNeg / meanStr : null;

  // FNAR
  const fabricated = successful.filter(
    (r) =>
      r.probe_type === "edge_fabricate" || r.probe_type === "missing_node"
  );
  const accepted = fabricated.filter((r) => r.absolute_shift! >= 0.05);
  const fnar = fabricated.length > 0 ? accepted.length / fabricated.length : null;

  // Critical path premium
  const onPath = successful
    .filter((r) => r.target_on_critical_path)
    .map((r) => r.absolute_shift!);
  const offPath = successful
    .filter((r) => !r.target_on_critical_path)
    .map((r) => r.absolute_shift!);

  const meanOn =
    onPath.length > 0
      ? onPath.reduce((a, b) => a + b, 0) / onPath.length
      : 0;
  const meanOff =
    offPath.length > 0
      ? offPath.reduce((a, b) => a + b, 0) / offPath.length
      : 0;
  const premium =
    onPath.length > 0 && offPath.length > 0 ? meanOn - meanOff : null;

  // Importance-sensitivity correlation (Spearman)
  const pairs = successful
    .filter((r) => r.target_importance > 0)
    .map((r) => ({
      importance: r.target_importance,
      shift: r.absolute_shift!,
    }));

  let correlation: number | null = null;
  if (pairs.length >= 3) {
    const rank = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return arr.map((v) => sorted.indexOf(v) + 1);
    };
    const impRanks = rank(pairs.map((p) => p.importance));
    const shiftRanks = rank(pairs.map((p) => p.shift));
    const n = pairs.length;
    const dSq = impRanks.reduce(
      (sum, r, i) => sum + (r - shiftRanks[i]) ** 2,
      0
    );
    correlation = 1 - (6 * dSq) / (n * (n * n - 1));
  }

  return {
    ssr,
    mean_shift_high: meanHigh,
    mean_shift_low: meanLow,
    asymmetry_index: asymmetry,
    mean_shift_negate: meanNeg,
    mean_shift_strengthen: meanStr,
    fnar,
    n_accepted: accepted.length,
    n_fabricated: fabricated.length,
    critical_path_premium: premium,
    mean_shift_on_path: meanOn,
    mean_shift_off_path: meanOff,
    importance_sensitivity_correlation: correlation,
  };
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------

function main() {
  const inputDir =
    process.argv[2] ||
    path.resolve(
      __dirname,
      "../../outputs/sensitivity_causal_llama_one-turn/question_results"
    );
  const outputBase = path.resolve(__dirname, "../public/data");
  const questionsDir = path.join(outputBase, "questions");

  // Also check shared stages for additional data
  const sharedDir = path.resolve(
    __dirname,
    "../../outputs/_shared_stages_causal"
  );

  console.log(`Reading from: ${inputDir}`);
  console.log(`Shared stages: ${sharedDir}`);
  console.log(`Output to: ${outputBase}`);

  // Ensure output directories exist
  fs.mkdirSync(questionsDir, { recursive: true });

  // Collect all question JSON files
  const allFiles: string[] = [];

  // Primary: per-question results (have probe_results)
  if (fs.existsSync(inputDir)) {
    const files = fs
      .readdirSync(inputDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.join(inputDir, f));
    allFiles.push(...files);
  }

  // Fallback: shared stages (may only have partial data)
  if (allFiles.length === 0 && fs.existsSync(sharedDir)) {
    const files = fs
      .readdirSync(sharedDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.join(sharedDir, f));
    allFiles.push(...files);
  }

  console.log(`Found ${allFiles.length} question files`);

  const index: Array<{
    question_id: string;
    question_text: string;
    source: string;
    initial_probability: number;
    n_nodes: number;
    n_edges: number;
    mean_absolute_shift: number | null;
    max_absolute_shift: number | null;
    ssr: number | null;
  }> = [];

  let totalSSR = 0;
  let ssrCount = 0;
  let totalMeanShift = 0;
  let shiftCount = 0;
  let totalNodes = 0;
  let totalEdges = 0;

  for (const file of allFiles) {
    try {
      const raw = fs.readFileSync(file, "utf-8");
      const q: QuestionJSON = JSON.parse(raw);

      // Skip if no probe results
      if (!q.probe_results || q.probe_results.length === 0) {
        console.log(`  Skipping ${q.question_id}: no probe results`);
        continue;
      }

      // Compute derived metrics
      const metrics = computeMetrics(q.probe_results);

      // Build enriched question detail
      const detail = {
        ...q,
        aggregate_metrics: metrics,
      };

      // Write per-question detail
      const detailPath = path.join(questionsDir, `${q.question_id}.json`);
      fs.writeFileSync(detailPath, JSON.stringify(detail, null, 2));

      // Build index entry
      const nNodes = q.network_analysis?.n_nodes ?? q.nodes.length;
      const nEdges = q.network_analysis?.n_edges ?? q.edges.length;

      index.push({
        question_id: q.question_id,
        question_text: q.question_text,
        source: q.source,
        initial_probability: q.initial_probability,
        n_nodes: nNodes,
        n_edges: nEdges,
        mean_absolute_shift: q.summary?.mean_absolute_shift ?? null,
        max_absolute_shift: q.summary?.max_absolute_shift ?? null,
        ssr: metrics.ssr,
      });

      if (metrics.ssr != null) {
        totalSSR += metrics.ssr;
        ssrCount++;
      }
      if (q.summary?.mean_absolute_shift != null) {
        totalMeanShift += q.summary.mean_absolute_shift;
        shiftCount++;
      }
      totalNodes += nNodes;
      totalEdges += nEdges;

      console.log(
        `  Processed: ${q.question_id} (${nNodes} nodes, SSR: ${metrics.ssr?.toFixed(2) ?? "N/A"})`
      );
    } catch (err) {
      console.error(`  Error processing ${file}:`, err);
    }
  }

  // Extract model name from directory path
  const dirName = path.basename(
    inputDir.includes("question_results")
      ? path.dirname(inputDir)
      : inputDir
  );
  const modelMatch = dirName.match(/sensitivity_causal_(\w+)_/);
  const model = modelMatch ? modelMatch[1] : "unknown";
  const conditionMatch = dirName.match(/_(one-turn|multi-turn)$/);
  const condition = conditionMatch ? conditionMatch[1] : "one-turn";

  // Write summary
  const summary = {
    total_questions: index.length,
    model,
    condition,
    avg_ssr: ssrCount > 0 ? totalSSR / ssrCount : null,
    avg_mean_shift: shiftCount > 0 ? totalMeanShift / shiftCount : 0,
    avg_nodes: index.length > 0 ? totalNodes / index.length : 0,
    avg_edges: index.length > 0 ? totalEdges / index.length : 0,
    questions: index,
  };

  const summaryPath = path.join(outputBase, "summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`\nDone! Wrote ${index.length} questions.`);
  console.log(`  Summary: ${summaryPath}`);
  console.log(`  Details: ${questionsDir}/`);
  console.log(
    `  Avg SSR: ${summary.avg_ssr?.toFixed(2) ?? "N/A"}, Avg Shift: ${(summary.avg_mean_shift * 100).toFixed(1)}pp`
  );
}

main();
