import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const RUN = "X-Lovable-AIG-Run-ID";

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN)) headers.set(RUN, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN)?.trim() || undefined;
    return res;
  };
}

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function generateText(instructions: string, prompt: string): Promise<string> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new AiError(401, "AI is not configured.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });
  let failure: unknown;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions,
    prompt,
    onError: ({ error }) => {
      failure = error;
    },
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  let text = "";
  try {
    text = await result.text;
  } catch (e) {
    failure ??= e;
  }
  if (failure || !text) {
    const status = (failure as { statusCode?: number })?.statusCode ?? 500;
    if (status === 402) throw new AiError(402, "AI credits are used up. Add credits in workspace billing to continue.");
    if (status === 429) throw new AiError(429, "Too many requests right now. Please wait a moment and try again.");
    if (status === 403) throw new AiError(403, "AI access is blocked for this workspace.");
    throw new AiError(status, "The AI could not generate a course. Please try again.");
  }
  return text;
}
