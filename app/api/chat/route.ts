import { experimental_streamText, StreamingTextResponse } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { messages, providerId, apiKey, baseURL, modelId } =
    (await req.json()) as {
      messages: any[];
      providerId: string;
      baseURL: string;
      apiKey: string;
      modelId: string;
    };

  if (!providerId || !baseURL || !modelId) {
    return new Response(`Malformed request`, {
      status: 400,
    });
  }

  let provider;
  switch (providerId) {
    case "openai":
      provider = createOpenAI({ apiKey, baseURL });
      break;
    case "anthropic":
      provider = createAnthropic({ apiKey });
      break;
    case "mistral":
      provider = createMistral({ apiKey, baseURL });
      break;
    default:
      return new Response(`Unsupported provider ${providerId}`, {
        status: 400,
      });
  }

  try {
    const result = await experimental_streamText({
      model: provider.chat(modelId),
      messages,
    });
    return new StreamingTextResponse(result.toAIStream());
  } catch (e: unknown) {
    return new Response(e instanceof Error ? e.message : "Unknown error", {
      status: 500,
    });
  }
}
