import { NextRequest, NextResponse } from "next/server";
import { runFullPipeline } from "@/lib/causal-pipeline";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question, background, resolution_date, model, api_key } = body;

  if (!question || typeof question !== "string") {
    return NextResponse.json(
      { error: "question is required" },
      { status: 400 }
    );
  }

  const apiKey = api_key || process.env.OPENROUTER_API_KEY;
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
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await runFullPipeline(
          question,
          background,
          resolution_date,
          selectedModel,
          apiKey,
          (update) => {
            const data = JSON.stringify(update);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        );

        const doneData = JSON.stringify({ done: true, result });
        controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
        controller.close();
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "An unknown error occurred during analysis";
        console.error("Analysis error:", err);
        const errorData = JSON.stringify({ error: errorMsg });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
