# Belief Sensitivity Explorer

Interactive research demo exploring how sensitive LLM probability forecasts are to their underlying causal assumptions.

Given a binary yes/no forecasting question, the tool:

1. **Causal Forecast** — An LLM generates a probability estimate along with an explicit causal network (nodes = factors, directed edges = causal mechanisms).
2. **Network Analysis** — Graph metrics (betweenness centrality, PageRank, path relevance) identify structurally important nodes and edges.
3. **Probe Experiments** — Targeted counterfactual probes challenge individual beliefs (negating nodes, severing edges, introducing spurious connections) and measure the resulting probability shift.

## Features

- **Explore** — Browse pre-computed sensitivity results with interactive D3 causal network visualizations
- **Live Mode** — Enter any forecasting question, select 1–4 models, and run the full pipeline in real-time via OpenRouter
- **Compare Models** — Run the same question through two models side-by-side to compare causal structures and sensitivity
- **Interactive Probing** — Write custom counterfactuals and see how the forecast shifts

## Key Metrics

| Metric | Description |
|--------|-------------|
| **SSR** (Sensitivity-to-Structure Ratio) | Ratio of mean shift from high-importance vs low-importance probes. SSR > 1 means the model is more sensitive to structurally important components. |
| **Asymmetry Index** | Ratio of negation shift vs strengthening shift. Values > 1 indicate the model reacts more to challenges than confirmations. |
| **SAR** (Spurious Acceptance Rate) | Fraction of spurious/missing-node probes causing significant shift. High SAR suggests the model accepts spurious evidence. |
| **Critical Path Premium** | Extra sensitivity for nodes/edges on the shortest path to the outcome vs off-path. |

## Supported Models (Live Mode)

- Llama 3.3 70B
- Qwen3 235B
- DeepSeek V3
- Claude 3.5 Sonnet
- GPT-4o
- Gemini 2.0 Flash
- Mistral Large

All models are accessed via [OpenRouter](https://openrouter.ai/). Provide your own API key or use the server-side default.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Graph Visualization**: D3.js (force-directed causal networks)
- **Charts**: Recharts
- **LLM API**: OpenRouter

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Data Preparation

To load pre-computed sensitivity results from the main experiment pipeline:

```bash
npm run prepare-data
```

This reads outputs from `../outputs/sensitivity_causal_*/` and generates static JSON in `public/data/`.

## Deployment

Optimized for Vercel:

```bash
npm run build
```

Set the `OPENROUTER_API_KEY` environment variable for the live mode server-side fallback.
