const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callOpenRouter(
  messages: ChatMessage[],
  opts: {
    model: string;
    apiKey: string;
    jsonMode?: boolean;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const payload: Record<string, unknown> = {
    model: opts.model,
    messages,
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 2048,
  };

  if (opts.jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const res = await fetch(OPENROUTER_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
      "HTTP-Referer": "https://belief-sensitivity-explorer.vercel.app",
      "X-Title": "Belief Sensitivity Explorer",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }

  const data: OpenRouterResponse = await res.json();
  return data.choices[0]?.message?.content ?? "";
}

export function parseJsonResponse(raw: string): unknown {
  // Try direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // noop
  }

  // Try extracting from markdown code block
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // noop
    }
  }

  // Try extracting outermost braces
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {
      // noop
    }
  }

  throw new Error(`Failed to parse JSON from response: ${raw.slice(0, 200)}`);
}
