// Matches Python dataclasses from forecast_bench/

export interface CausalNode {
  id: string;
  description: string;
  role: "factor" | "outcome";
}

export interface CausalEdge {
  from: string;
  to: string;
  mechanism: string;
}

export interface NodeMetrics {
  node_id: string;
  description: string;
  role: string;
  in_degree: number;
  out_degree: number;
  betweenness: number;
  closeness: number;
  pagerank: number;
  path_relevance: number;
  composite_importance: number;
}

export interface EdgeMetrics {
  source: string;
  target: string;
  mechanism: string;
  edge_betweenness: number;
  on_critical_path: boolean;
}

export interface ProbeTarget {
  target_type: "node" | "edge" | "missing_edge" | "structural";
  target_id: string;
  description: string;
  importance: number;
  centrality_rank: number;
  on_critical_path: boolean;
  probe_type: string;
}

export interface NetworkAnalysis {
  n_nodes: number;
  n_edges: number;
  density: number;
  is_dag: boolean;
  n_weakly_connected: number;
  n_strongly_connected: number;
  outcome_node: string;
  node_metrics: NodeMetrics[];
  edge_metrics: EdgeMetrics[];
  probe_targets: ProbeTarget[];
}

export interface Probe {
  probe_text: string;
  probe_type: string;
  target_id: string;
  generated: boolean;
  target_type: string;
  importance: number;
  centrality_rank: number;
  on_critical_path: boolean;
  description: string;
}

export interface ProbeResult {
  probe_type: string;
  target_reason_id: string | null;
  probe_text: string;
  probe_generated: boolean;
  success: boolean;
  updated_probability: number | null;
  absolute_shift: number | null;
  shift_direction: "increased" | "decreased" | "unchanged";
  reasoning: string;
  raw_response: string;
  target_id: string;
  target_type: string;
  target_importance: number;
  target_centrality_rank: number;
  target_on_critical_path: boolean;
  probe_category: "node" | "edge" | "structural";
}

export interface QuestionSummary {
  question_id: string;
  question_text: string;
  source: string;
  condition: string;
  initial_probability: number;
  n_probes: number;
  n_successful: number;
  mean_absolute_shift: number | null;
  max_absolute_shift: number | null;
}

export interface QuestionDetail {
  question_id: string;
  question_text: string;
  source: string;
  initial_probability: number;
  nodes: CausalNode[];
  edges: CausalEdge[];
  reasoning: string;
  network_analysis: NetworkAnalysis;
  probe_targets: ProbeTarget[];
  probes: Probe[];
  condition: string;
  probe_results: ProbeResult[];
  summary: QuestionSummary;
}

// Derived metrics computed by prepare-data script
export interface AggregateMetrics {
  ssr: number | null;
  mean_shift_high: number;
  mean_shift_low: number;
  asymmetry_index: number | null;
  mean_shift_negate: number;
  mean_shift_strengthen: number;
  fnar: number | null;
  n_accepted: number;
  n_spurious: number;
  critical_path_premium: number | null;
  mean_shift_on_path: number;
  mean_shift_off_path: number;
  importance_sensitivity_correlation: number | null;
}

export interface QuestionIndex {
  question_id: string;
  question_text: string;
  source: string;
  initial_probability: number;
  n_nodes: number;
  n_edges: number;
  mean_absolute_shift: number | null;
  max_absolute_shift: number | null;
  ssr: number | null;
}

export interface DataSummary {
  total_questions: number;
  model: string;
  condition: string;
  avg_ssr: number | null;
  avg_mean_shift: number;
  avg_nodes: number;
  avg_edges: number;
  questions: QuestionIndex[];
}

// For the causal network D3 visualization
export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  description: string;
  role: string;
  composite_importance: number;
  betweenness: number;
  pagerank: number;
  in_degree: number;
  out_degree: number;
  sensitivity?: number; // avg |delta| from probes targeting this node
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  mechanism: string;
  edge_betweenness: number;
  on_critical_path: boolean;
}
