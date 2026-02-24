import { NextRequest, NextResponse } from "next/server";
import { runFullPipeline } from "@/lib/causal-pipeline";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, background, resolution_date, model, api_key } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 }
      );
    }

    const apiKey =
      api_key || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "No API key provided. Either pass api_key in the request body or set OPENROUTER_API_KEY environment variable.",
        },
        { status: 400 }
      );
    }

    const selectedModel = model || "meta-llama/llama-3.3-70b-instruct";

    const result = await runFullPipeline(
      question,
      background,
      resolution_date,
      selectedModel,
      apiKey
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "An unknown error occurred during analysis",
      },
      { status: 500 }
    );
  }
}
